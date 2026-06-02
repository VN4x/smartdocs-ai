import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";

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

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
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

  async function submitCreate() {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await createFolder(newName);
      await refresh();
      setNewName("");
      setCreateOpen(false);
      toast.success("Folder created.");
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
                <SidebarMenuButton asChild isActive={currentFolder === null}>
                  <Link to="/library" search={{ folder: undefined }}>
                    <Files className="h-4 w-4" />
                    <span>All documents</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentFolder === "unfiled"}>
                  <Link to="/library" search={{ folder: "unfiled" }}>
                    <Inbox className="h-4 w-4" />
                    <span>Unfiled</span>
                    {unfiledCount > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">{unfiledCount}</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Folders</SidebarGroupLabel>
          <SidebarGroupAction title="New folder" onClick={() => setCreateOpen(true)}>
            <Plus /> <span className="sr-only">New folder</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                  No folders yet.
                </p>
              ) : (
                folders.map((f) => {
                  const active = currentFolder === f.id;
                  return (
                    <SidebarMenuItem key={f.id}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link to="/library" search={{ folder: f.id }}>
                          {active ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                          <span className="truncate">{f.name}</span>
                          {countFor(f.id) > 0 && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {countFor(f.id)}
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
                          <DropdownMenuItem
                            onClick={() => {
                              setRenaming(f);
                              setRenameName(f.name);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(f)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Create folder */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
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
              The folder is removed. Documents inside it are kept and moved to Unfiled.
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
