import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listFolders,
  listDocuments,
  createFolder,
  renameFolder,
  deleteFolder,
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [busy, setBusy] = useState(false);

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
      toast.success(createParent ? "Subfolder created." : "Folder created.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create folder.");
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
      toast.success("Folder renamed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't rename folder.");
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
      toast.success("Folder deleted. Its documents moved to Unfiled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete folder.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentFolder === null} className={ACTIVE_RED}>
                  <Link to="/library" search={{ folder: undefined }}>
                    <Files className="h-4 w-4" />
                    <span>All documents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentFolder === "unfiled"} className={ACTIVE_RED}>
                  <Link to="/library" search={{ folder: "unfiled" }}>
                    <Inbox className="h-4 w-4" />
                    <span>Unfiled</span>
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
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupAction title="New folder" onClick={() => openCreate(null)}>
            <Plus /> <span className="sr-only">New folder</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {tree.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No folders yet.
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
              {createParent ? `New subfolder in "${createParent.name}"` : "New folder"}
            </DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={newName}
            placeholder="Folder name"
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitCreate} disabled={busy || !newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename folder */}
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button onClick={submitRename} disabled={busy || !renameName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete folder */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleting?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder is removed. Documents inside it are kept and moved to Unfiled. Any
              subfolders are also affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
}: {
  node: FolderNode;
  depth?: number;
  currentFolder: string | null;
  countFor: (id: string) => number;
  isAdmin: boolean;
  onCreateSub: (parent: FolderRow) => void;
  onRename: (f: FolderRow) => void;
  onDelete: (f: FolderRow) => void;
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
        <SidebarMenuSub className="mr-0 pr-0">
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
            />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
