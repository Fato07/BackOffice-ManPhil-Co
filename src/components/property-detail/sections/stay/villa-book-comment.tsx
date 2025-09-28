"use client"

import { useState, useTransition } from "react"
import { PropertyWithRelations, StayMetadata } from "@/types/property"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { updateVillaBookComment } from "@/actions/property-stay"
import { MessageSquare, Globe, Plus } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VillaBookCommentProps {
  property: PropertyWithRelations
}

const languageOptions = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
]

const defaultTemplate = `GENERAL
• ACCESS
[Property access details]

• LOCALISATION:
Distance port: [X] km
Distance supermarchés: [X] km
Distance plage: [X] m

• WIFI: Password: [password]

• SYSTÈME SONORE
[Sound system information]

• SÉCURITÉ
[Security codes and information]

• POUBELLES
[Waste disposal information]

• NUMÉROS IMPORTANTS
Police: 17
Pompier: 18
Service médical d'urgence: 15
Urgences générales: 112

• CUISINE
[Kitchen amenities]`

export function VillaBookComment({ property }: VillaBookCommentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const metadata = property.stayMetadata as StayMetadata | null
  const existingComments = metadata?.villaBookComment || {}
  
  // State for editing
  const [comments, setComments] = useState<Record<string, string>>(existingComments)
  const [activeTab, setActiveTab] = useState(Object.keys(comments)[0] || 'fr')
  const [newLanguage, setNewLanguage] = useState('')

  const handleSave = () => {
    const hasContent = Object.values(comments).some(content => content.trim().length > 0)
    
    if (!hasContent) {
      toast.error("Please add content for at least one language")
      return
    }

    startTransition(async () => {
      try {
        // Save all language versions
        for (const [language, content] of Object.entries(comments)) {
          if (content.trim()) {
            const result = await updateVillaBookComment({
              propertyId: property.id,
              language,
              content: content.trim()
            })

            if (!result.success) {
              throw new Error(result.error || `Failed to update ${language} content`)
            }
          }
        }

        setIsEditing(false)
        toast.success("Villa book comments updated successfully")
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update villa book comments")
      }
    })
  }

  const handleCancel = () => {
    setComments(existingComments)
    setActiveTab(Object.keys(existingComments)[0] || 'en')
    setIsEditing(false)
  }

  const addLanguage = () => {
    if (newLanguage && !comments[newLanguage]) {
      setComments({
        ...comments,
        [newLanguage]: defaultTemplate
      })
      setActiveTab(newLanguage)
      setNewLanguage('')
    }
  }

  const removeLanguage = (language: string) => {
    const newComments = { ...comments }
    delete newComments[language]
    setComments(newComments)
    
    // Switch to another tab if removing active tab
    if (activeTab === language) {
      const remainingLanguages = Object.keys(newComments)
      setActiveTab(remainingLanguages[0] || '')
    }
  }

  const updateComment = (language: string, content: string) => {
    setComments({
      ...comments,
      [language]: content
    })
  }

  const handleEdit = () => {
    setIsEditing(true)
    // If no comments exist, initialize with English as default
    if (Object.keys(comments).length === 0) {
      setComments({ en: '' })
      setActiveTab('en')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          Comment for Villa Book
        </h4>
        {!isEditing ? (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-600 mb-4">
          Create villa book content in multiple languages for your guests. This information will be provided to guests upon arrival.
        </p>

        {Object.keys(comments).length === 0 && !isEditing ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No villa book comments added yet</p>
            <p className="text-sm mt-1">Click Edit to add content</p>
          </div>
        ) : Object.keys(comments).length > 0 || isEditing ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                {Object.keys(comments).map(lang => {
                  const langOption = languageOptions.find(opt => opt.code === lang)
                  return (
                    <TabsTrigger key={lang} value={lang} className="flex items-center gap-2">
                      <span>{langOption?.flag || <Globe className="h-3 w-3" />}</span>
                      <span>{langOption?.label || lang.toUpperCase()}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
              
              {isEditing && (
                <div className="flex items-center gap-2">
                  <Select value={newLanguage} onValueChange={setNewLanguage}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Add language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions
                        .filter(opt => !comments[opt.code])
                        .map(opt => (
                          <SelectItem key={opt.code} value={opt.code}>
                            <span className="flex items-center gap-2">
                              <span>{opt.flag}</span>
                              <span>{opt.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={addLanguage} disabled={!newLanguage}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {Object.entries(comments).map(([lang, content]) => (
              <TabsContent key={lang} value={lang} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Content</Label>
                    {isEditing && Object.keys(comments).length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeLanguage(lang)}
                      >
                        Remove Language
                      </Button>
                    )}
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => updateComment(lang, e.target.value)}
                    placeholder="Enter villa book content for this language..."
                    disabled={!isEditing}
                    rows={15}
                    className="font-mono text-sm"
                  />
                  {!isEditing && (
                    <pre className="mt-4 p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                      {content}
                    </pre>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    </div>
  )
}