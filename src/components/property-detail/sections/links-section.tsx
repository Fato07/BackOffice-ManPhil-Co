"use client"

import { useState, useCallback } from "react"
import { 
  Upload, 
  Link, 
  FileText, 
  Download, 
  Edit2, 
  Trash2, 
  Plus,
  ExternalLink,
  File,
  Image,
  FolderOpen
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  usePropertyResources, 
  useCreateResource, 
  useUpdateResource, 
  useDeleteResource 
} from "@/hooks/use-resources"
import { Resource } from "@/generated/prisma"
import { toast } from "sonner"
import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/types/auth"

interface LinksSectionProps {
  propertyId: string
}

const RESOURCE_TYPES = [
  { value: "contract", label: "Contract", icon: FileText },
  { value: "manual", label: "Manual", icon: FileText },
  { value: "photo", label: "Photo", icon: Image },
  { value: "document", label: "Document", icon: File },
  { value: "link", label: "External Link", icon: ExternalLink },
  { value: "other", label: "Other", icon: FolderOpen },
]

function getResourceIcon(type: string) {
  const resourceType = RESOURCE_TYPES.find(t => t.value === type)
  return resourceType?.icon || File
}

export function LinksSection({ propertyId }: LinksSectionProps) {
  const { hasPermission } = usePermissions()
  const canEdit = hasPermission(Permission.PROPERTY_EDIT)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null)
  const [uploadType, setUploadType] = useState<"file" | "url">("url")
  const [isDragging, setIsDragging] = useState(false)

  const { data: resources = [], isLoading } = usePropertyResources(propertyId)
  const createResource = useCreateResource(propertyId)
  const updateResource = useUpdateResource()
  const deleteResource = useDeleteResource()

  // Resource form data
  const [createForm, setCreateForm] = useState({
    type: "document",
    name: "",
    url: "",
    file: "",
    fileName: "",
  })

  const [editForm, setEditForm] = useState({
    type: "",
    name: "",
  })

  const handleFileUpload = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setCreateForm(prev => ({
        ...prev,
        file: e.target?.result as string,
        fileName: file.name,
        name: file.name,
      }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)

    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
      setUploadType("file")
      setIsCreateDialogOpen(true)
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!createForm.name || !createForm.type) {
      toast.error("Please fill in all required fields")
      return
    }

    if (uploadType === "url" && !createForm.url) {
      toast.error("Please provide a URL")
      return
    }

    if (uploadType === "file" && !createForm.file) {
      toast.error("Please select a file")
      return
    }

    await createResource.mutateAsync({
      type: createForm.type,
      name: createForm.name,
      url: uploadType === "url" ? createForm.url : undefined,
      file: uploadType === "file" ? createForm.file.split(",")[1] : undefined, // Remove data:type;base64, prefix
      fileName: uploadType === "file" ? createForm.fileName : undefined,
    })

    setIsCreateDialogOpen(false)
    setCreateForm({
      type: "document",
      name: "",
      url: "",
      file: "",
      fileName: "",
    })
  }

  const handleUpdateResource = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingResource) return

    await updateResource.mutateAsync({
      id: editingResource.id,
      data: {
        type: editForm.type,
        name: editForm.name,
      },
    })

    setEditingResource(null)
  }

  const handleDeleteResource = async () => {
    if (!deletingResource) return

    await deleteResource.mutateAsync(deletingResource.id)
    setDeletingResource(null)
  }

  // Group resources by type
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = []
    }
    acc[resource.type].push(resource)
    return acc
  }, {} as Record<string, Resource[]>)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Links and Resources</h2>
        {canEdit && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        )}
      </div>

      {canEdit && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-gray-300"
          }`}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop files here, or click the button above
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Supports PDF, DOC, DOCX, images, and more (max 10MB)
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : resources.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No resources uploaded yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Add contracts, manuals, or other documents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedResources).map(([type, typeResources]) => {
            const Icon = getResourceIcon(type)
            const typeLabel = RESOURCE_TYPES.find(t => t.value === type)?.label || type
            
            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {typeLabel}
                    <Badge variant="secondary" className="ml-auto">
                      {typeResources.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {typeResources.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <Icon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{resource.name}</p>
                            <p className="text-xs text-gray-500">
                              Added {new Date(resource.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {resource.url.startsWith("http") && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => window.open(resource.url, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const link = document.createElement("a")
                              link.href = resource.url
                              link.download = resource.name
                              link.click()
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditForm({
                                    type: resource.type,
                                    name: resource.name,
                                  })
                                  setEditingResource(resource)
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => setDeletingResource(resource)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div>
              <Label>Upload Type</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={uploadType === "url" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadType("url")}
                  className="flex-1"
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL Link
                </Button>
                <Button
                  type="button"
                  variant={uploadType === "file" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadType("file")}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  File Upload
                </Button>
              </div>
            </div>

            <div>
              <Label>Resource Type *</Label>
              <Select
                value={createForm.type}
                onValueChange={(value) => setCreateForm({ ...createForm, type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., Rental Contract 2024"
                className="mt-2"
              />
            </div>

            {uploadType === "url" && (
              <div>
                <Label>URL *</Label>
                <Input
                  type="url"
                  value={createForm.url}
                  onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
                  placeholder="https://example.com/document.pdf"
                  className="mt-2"
                />
              </div>
            )}

            {uploadType === "file" && (
              <div>
                <Label>File *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleFileUpload(file)
                      }
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  {createForm.fileName && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {createForm.fileName}
                    </p>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setCreateForm({
                    type: "document",
                    name: "",
                    url: "",
                    file: "",
                    fileName: "",
                  })
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createResource.isPending}>
                Add Resource
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!editingResource} 
        onOpenChange={(open) => !open && setEditingResource(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleUpdateResource} className="space-y-4">
            <div>
              <Label>Resource Type *</Label>
              <Select
                value={editForm.type}
                onValueChange={(value) => setEditForm({ ...editForm, type: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Name *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Resource name"
                className="mt-2"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingResource(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateResource.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!deletingResource} 
        onOpenChange={(open) => !open && setDeletingResource(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete "{deletingResource?.name}"? 
            This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingResource(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteResource}
              disabled={deleteResource.isPending}
            >
              Delete Resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}