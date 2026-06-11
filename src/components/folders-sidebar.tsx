import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFolders,
  listDocuments,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  descendantFolderIds,
  folderOptions,
  isCurrentUserAdmin,
  type FolderRow,
} from "@/lib/documents";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Folder,
  FolderOpen,
  Files,
  Inbox,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  ChevronRight,
  FolderPlus,
  FolderInput,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n";

const TOP_LEVEL = "__top__";


/** Active folders keep a normal background but show a red, bold title. */
const ACTIVE_RED =
  "data-[active=true]:bg-transparent data-[active=true]:text-red-600 data-[active=true]:font-semibold hover:data-[active=true]:bg-accent";

type FolderNode = FolderRow & { children: FolderNode[] };

function buildTree(folders: FolderRow[]): FolderNode[] {
  const byId = new Map<string, FolderNode>();
  folders.forEach((f) => byId.set(f.id, { ...f, children: [] }));
  const roots: FolderNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function FoldersSidebar() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const currentFolder = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => m.routeId === "/_authenticated/library");
      return (match?.search as { folder?: string } | undefined)?.folder ?? null;
    },
  });

  const { data: folders = [] } = useQuery({ queryKey: ["folders"], queryFn: listFolders });
  const { data: docs = [] } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const { data: isAdmin = false } = useQuery({ queryKey: ["is-admin"], queryFn: isCurrentUserAdmin });

  const tree = useMemo(() => buildTree(folders), [folders]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [createParent, setCreateParent] = useState<FolderRow | null>(null);
  const [renaming, setRenaming] = useState<FolderRow | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleting, setDeleting] = useState<FolderRow | null>(null);
  const [moving, setMoving] = useState<FolderRow | null>(null);
  const [moveTarget, setMoveTarget] = useState<string>(TOP_LEVEL);
  const [busy, setBusy] = useState(false);

  const moveOptions = useMemo(() => {
    if (!moving) return [];
    const blocked = descendantFolderIds(folders, moving.id);
    blocked.add(moving.id);
    return folderOptions(folders).filter((o) => !blocked.has(o.id));
  }, [moving, folders]);

  const unfiledCount = docs.filter((d) => !d.folder_id).length;
  const countFor = (id: string) => docs.filter((d) => d.folder_id === id).length;

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["folders"] });
    await queryClient.invalidateQueries({ queryKey: ["documents"] });
  }

  function openCreate(parent: FolderRow | null) {
    setCreateParent(parent);
    setNewName("");
    setCreateOpen(true);
  }

  async function submitCreate() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createFolder(newName, createParent?.id ?? null);
      await refresh();
      setNewName("");
      setCreateOpen(false);
      toast.success(createParent ? t("toast.subfolderCreated") : t("toast.folderCreated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.folderCreateErr"));
    } finally {
      setBusy(false);
    }
  }

  async function submitRename() {
    if (!renaming || !renameName.trim()) return;
    setBusy(true);
    try {
      await renameFolder(renaming.id, renameName);
      await refresh();
      setRenaming(null);
      toast.success(t("toast.folderRenamed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.folderRenameErr"));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteFolder(deleting.id);
      await refresh();
      setDeleting(null);
      toast.success(t("toast.folderDeleted"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.folderDeleteErr"));
    } finally {
      setBusy(false);
    }
  }

  function openMove(folder: FolderRow) {
    setMoving(folder);
    setMoveTarget(folder.parent_id ?? TOP_LEVEL);
  }

  async function submitMove() {
    if (!moving) return;
    setBusy(true);
    try {
      await moveFolder(moving.id, moveTarget === TOP_LEVEL ? null : moveTarget);
      await refresh();
      setMoving(null);
      toast.success(t("toast.folderMoved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("toast.folderMoveErr"));
    } finally {
      setBusy(false);
    }
  }



  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.library")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentFolder === null} className={ACTIVE_RED}>
                  <Link to="/library" search={{ folder: undefined }}>
                    <Files className="h-4 w-4" />
                    <span>{t("sidebar.allDocuments")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentFolder === "unfiled"} className={ACTIVE_RED}>
                  <Link to="/library" search={{ folder: "unfiled" }}>
                    <Inbox className="h-4 w-4" />
                    <span>{t("sidebar.unfiled")}</span>
                    {unfiledCount > 0 && (
                      <span className="ml-auto text-xs opacity-70">{unfiledCount}</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t("sidebar.folders")}</SidebarGroupLabel>
          <SidebarGroupAction title={t("sidebar.newFolder")} onClick={() => openCreate(null)}>
            <Plus /> <span className="sr-only">{t("sidebar.newFolder")}</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu className="gap-[3mm]">

              {tree.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {t("sidebar.noFolders")}
                </p>
              ) : (
                tree.map((node) => (
                  <FolderItem
                    key={node.id}
                    node={node}
                    currentFolder={currentFolder}
                    countFor={countFor}
                    isAdmin={isAdmin}
                    onCreateSub={openCreate}
                    onRename={(f) => {
                      setRenaming(f);
                      setRenameName(f.name);
                    }}
                    onDelete={setDeleting}
                    onMove={openMove}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Create folder */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createParent ? t("sidebar.newSubfolderIn", { name: createParent.name }) : t("sidebar.newFolder")}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={newName}
            placeholder={t("sidebar.folderNamePlaceholder")}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitCreate} disabled={busy || !newName.trim()}>
              {t("common.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder */}
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sidebar.renameFolder")}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitRename} disabled={busy || !renameName.trim()}>
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("sidebar.deleteFolderTitle", { name: deleting?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("sidebar.deleteFolderDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move folder */}
      <Dialog open={!!moving} onOpenChange={(open) => !open && setMoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("sidebar.moveFolderTitle", { name: moving?.name ?? "" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t("sidebar.moveFolderDesc")}</p>
            <Select value={moveTarget} onValueChange={setMoveTarget}>
              <SelectTrigger>
                <SelectValue placeholder={t("sidebar.moveSelectDest")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TOP_LEVEL}>{t("sidebar.moveTopLevel")}</SelectItem>
                {moveOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.path}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoving(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submitMove} disabled={busy}>
              {t("sidebar.move")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

function FolderItem({
  node,
  depth = 0,
  currentFolder,
  countFor,
  isAdmin,
  onCreateSub,
  onRename,
  onDelete,
  onMove,
}: {
  node: FolderNode;
  depth?: number;
  currentFolder: string | null;
  countFor: (id: string) => number;
  isAdmin: boolean;
  onCreateSub: (parent: FolderRow) => void;
  onRename: (f: FolderRow) => void;
  onDelete: (f: FolderRow) => void;
  onMove: (f: FolderRow) => void;
}) {
  const active = currentFolder === node.id;
  const hasChildren = node.children.length > 0;
  // Expand if this node or any descendant is the active folder.
  const containsActive = useMemo(() => {
    const walk = (n: FolderNode): boolean =>
      n.id === currentFolder || n.children.some(walk);
    return walk(node);
  }, [node, currentFolder]);
  const [open, setOpen] = useState(containsActive);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} className={ACTIVE_RED}>
        <Link to="/library" search={{ folder: node.id }}>
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              className="shrink-0"
              aria-label={open ? "Collapse" : "Expand"}
            >
              <ChevronRight
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")}
              />
            </button>
          ) : (
            active ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
          )}
          <span className="truncate">{node.name}</span>
          {countFor(node.id) > 0 && (
            <span className={cn("ml-auto text-xs", active ? "opacity-70" : "text-muted-foreground")}>
              {countFor(node.id)}
            </span>
          )}
        </Link>
      </SidebarMenuButton>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover>
            <MoreHorizontal />
            <span className="sr-only">Folder actions</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onClick={() => onCreateSub(node)}>
            <FolderPlus className="mr-2 h-4 w-4" /> New subfolder
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onRename(node)}>
            <Pencil className="mr-2 h-4 w-4" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onMove(node)}>
            <FolderInput className="mr-2 h-4 w-4" /> Move to…
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(node)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasChildren && open && (
        <SidebarMenuSub className="mr-0 gap-[3mm] pr-0">
          {node.children.map((child) => (
            <FolderItem
              key={child.id}
              node={child}
              depth={depth + 1}
              currentFolder={currentFolder}
              countFor={countFor}
              isAdmin={isAdmin}
              onCreateSub={onCreateSub}
              onRename={onRename}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
