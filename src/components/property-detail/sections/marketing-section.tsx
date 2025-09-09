"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PropertySection } from "../property-section"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUpdateProperty } from "@/hooks/use-properties"
import { PropertyWithRelations } from "@/types/property"
import { toast } from "sonner"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
]

const marketingSchema = z.object({
  marketingContent: z.record(z.string(), z.object({
    title: z.string().min(1, "Title is required"),
    tagline: z.string().optional(),
    shortDescription: z.string().refine(
      (val) => !val || val.length >= 50,
      "Short description must be at least 50 characters when provided"
    ),
    longDescription: z.string().refine(
      (val) => !val || val.length >= 100,
      "Long description must be at least 100 characters when provided"
    ),
    highlights: z.array(z.string()).default([]),
    seoKeywords: z.array(z.string()).default([]),
    metaDescription: z.string().max(160, "Meta description must be under 160 characters").optional(),
  })).default({}),
})

// type MarketingData = z.infer<typeof marketingSchema>

interface MarketingSectionProps {
  property: PropertyWithRelations
}

export function MarketingSection({ property }: MarketingSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeLanguage, setActiveLanguage] = useState("en")
  const updateProperty = useUpdateProperty()

  // Use automaticOffer field temporarily to store marketing content
  const marketingContent = (property.automaticOffer as { marketingContent?: Record<string, unknown> })?.marketingContent || {}
  // const availableLanguages = Object.keys(marketingContent).length > 0 
  //   ? Object.keys(marketingContent) 
  //   : ["en"]

  const form = useForm<z.input<typeof marketingSchema>>({
    resolver: zodResolver(marketingSchema),
    defaultValues: {
      marketingContent: marketingContent || { en: {
        title: property.name || "",
        tagline: "",
        shortDescription: "",
        longDescription: "",
        highlights: [],
        seoKeywords: [],
        metaDescription: "",
      }},
    },
  })

  const { formState: { errors } } = form

  const handleSave = async (data: z.input<typeof marketingSchema>) => {
    try {
      await updateProperty.mutateAsync({
        id: property.id,
        data: {
          automaticOffer: { marketingContent: data.marketingContent },
        },
      })
      toast.success("Marketing content updated successfully")
      setIsEditing(false)
    } catch {
      toast.error("Failed to update marketing content")
    }
  }

  const handleCancel = () => {
    form.reset()
    setIsEditing(false)
  }

  const addLanguage = (languageCode: string) => {
    const currentContent = form.getValues("marketingContent") || {}
    if (!currentContent[languageCode]) {
      form.setValue(`marketingContent.${languageCode}`, {
        title: property.name || "",
        tagline: "",
        shortDescription: "",
        longDescription: "",
        highlights: [],
        seoKeywords: [],
        metaDescription: "",
      })
      setActiveLanguage(languageCode)
    }
  }

  const removeLanguage = (languageCode: string) => {
    if (languageCode === "en") return // Can't remove English
    const currentContent = form.getValues("marketingContent") || {}
    delete currentContent[languageCode]
    form.setValue("marketingContent", currentContent)
    setActiveLanguage("en")
  }

  const addHighlight = () => {
    const currentHighlights = form.watch(`marketingContent.${activeLanguage}.highlights`) || []
    form.setValue(`marketingContent.${activeLanguage}.highlights`, [...currentHighlights, ""])
  }

  const removeHighlight = (index: number) => {
    const currentHighlights = form.watch(`marketingContent.${activeLanguage}.highlights`) || []
    form.setValue(`marketingContent.${activeLanguage}.highlights`, 
      currentHighlights.filter((_, i) => i !== index)
    )
  }

  const addKeyword = () => {
    const currentKeywords = form.watch(`marketingContent.${activeLanguage}.seoKeywords`) || []
    form.setValue(`marketingContent.${activeLanguage}.seoKeywords`, [...currentKeywords, ""])
  }

  const removeKeyword = (index: number) => {
    const currentKeywords = form.watch(`marketingContent.${activeLanguage}.seoKeywords`) || []
    form.setValue(`marketingContent.${activeLanguage}.seoKeywords`, 
      currentKeywords.filter((_, i) => i !== index)
    )
  }

  const currentLanguageContent = form.watch(`marketingContent.${activeLanguage}`)

  // Custom submit handler to prevent auto-focus on validation errors
  const handleSubmitWithoutFocus = async () => {
    // Prevent any default focus behavior
    const activeElement = document.activeElement as HTMLElement
    
    // Validate the form without auto-focus
    const isValid = await form.trigger()
    
    if (isValid) {
      // Get the form data and call handleSave
      const data = form.getValues()
      await handleSave(data)
    } else {
      // Blur the currently focused element to prevent unwanted focus
      if (activeElement) {
        activeElement.blur()
      }
    }
    // If validation failed, the error messages are already displayed in the UI
    // No need for a toast as the user can see the specific field errors
  }

  return (
    <PropertySection
      title="Marketing Content"
      isEditing={isEditing}
      onEdit={() => setIsEditing(true)}
      onSave={handleSubmitWithoutFocus}
      onCancel={handleCancel}
      isSaving={updateProperty.isPending}
    >
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-6">
        {/* Language Selector */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base">Available Languages</Label>
            {isEditing && (
              <div className="flex gap-2">
                {SUPPORTED_LANGUAGES.filter(lang => 
                  !Object.keys(form.watch("marketingContent") || {}).includes(lang.code)
                ).map(lang => (
                  <Button
                    key={lang.code}
                    size="sm"
                    variant="outline"
                    onClick={() => addLanguage(lang.code)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {lang.flag} {lang.code}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(form.watch("marketingContent") || {}).map(langCode => {
              const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode)
              return (
                <Badge
                  key={langCode}
                  variant={activeLanguage === langCode ? "default" : "outline"}
                  className="cursor-pointer py-2 px-3"
                  onClick={() => setActiveLanguage(langCode)}
                >
                  <span className="mr-2">{lang?.flag}</span>
                  {lang?.name || langCode}
                  {isEditing && langCode !== "en" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeLanguage(langCode)
                      }}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              )
            })}
          </div>
        </div>

        {/* Content Editor */}
        <Tabs value={activeLanguage} className="w-full">
          <TabsContent value={activeLanguage} className="space-y-6">
            <div>
              <Label>Property Title <span className="text-red-500">*</span></Label>
              <Input
                className="mt-2"
                disabled={!isEditing}
                {...form.register(`marketingContent.${activeLanguage}.title`)}
                placeholder="Enter property title"
                autoComplete="off"
                data-form-type="other"
              />
              {errors.marketingContent?.[activeLanguage]?.title && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.marketingContent[activeLanguage].title.message}
                </p>
              )}
            </div>

            <div>
              <Label>Tagline</Label>
              <Input
                className="mt-2"
                disabled={!isEditing}
                {...form.register(`marketingContent.${activeLanguage}.tagline`)}
                placeholder="Short, catchy phrase about the property"
              />
              <p className="text-sm text-muted-foreground mt-1">
                A memorable one-liner that captures the essence of this property
              </p>
            </div>

            <div>
              <Label>Short Description (for listings)</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register(`marketingContent.${activeLanguage}.shortDescription`)}
                placeholder="Brief description for property listings (50+ characters)"
                rows={3}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-muted-foreground">
                  Brief overview for property listings
                </p>
                <p className={cn(
                  "text-sm transition-colors",
                  currentLanguageContent?.shortDescription && currentLanguageContent.shortDescription.length >= 50
                    ? "text-green-600 font-medium"
                    : currentLanguageContent?.shortDescription && currentLanguageContent.shortDescription.length > 0
                    ? "text-amber-600"
                    : "text-muted-foreground"
                )}>
                  {currentLanguageContent?.shortDescription?.length || 0}/50+ characters
                </p>
              </div>
              {errors.marketingContent?.[activeLanguage]?.shortDescription && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.marketingContent[activeLanguage].shortDescription.message}
                </p>
              )}
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register(`marketingContent.${activeLanguage}.longDescription`)}
                placeholder="Detailed property description (100+ characters)"
                rows={8}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-muted-foreground">
                  Comprehensive property description
                </p>
                <p className={cn(
                  "text-sm transition-colors",
                  currentLanguageContent?.longDescription && currentLanguageContent.longDescription.length >= 100
                    ? "text-green-600 font-medium"
                    : currentLanguageContent?.longDescription && currentLanguageContent.longDescription.length > 0
                    ? "text-amber-600"
                    : "text-muted-foreground"
                )}>
                  {currentLanguageContent?.longDescription?.length || 0}/100+ characters
                </p>
              </div>
              {errors.marketingContent?.[activeLanguage]?.longDescription && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.marketingContent[activeLanguage].longDescription.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Key Highlights</Label>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addHighlight}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Highlight
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(currentLanguageContent?.highlights || []).map((highlight: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      disabled={!isEditing}
                      value={highlight}
                      onChange={(e) => {
                        const highlights = [...(currentLanguageContent?.highlights || [])]
                        highlights[index] = e.target.value
                        form.setValue(`marketingContent.${activeLanguage}.highlights`, highlights)
                      }}
                      placeholder="Enter a key highlight"
                    />
                    {isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeHighlight(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>SEO Keywords</Label>
                {isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addKeyword}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Keyword
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(currentLanguageContent?.seoKeywords || []).map((keyword: string, index: number) => (
                  <div key={index} className="flex items-center">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <Input
                          className="w-32"
                          value={keyword}
                          onChange={(e) => {
                            const keywords = [...(currentLanguageContent?.seoKeywords || [])]
                            keywords[index] = e.target.value
                            form.setValue(`marketingContent.${activeLanguage}.seoKeywords`, keywords)
                          }}
                          placeholder="Keyword"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => removeKeyword(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="secondary">{keyword}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Meta Description (SEO)</Label>
              <Textarea
                className="mt-2"
                disabled={!isEditing}
                {...form.register(`marketingContent.${activeLanguage}.metaDescription`)}
                placeholder="Brief description for search engines (max 160 characters)"
                rows={2}
                maxLength={160}
              />
              <p className="text-sm text-muted-foreground mt-1">
                {currentLanguageContent?.metaDescription?.length || 0} / 160 characters
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistics */}
        {!isEditing && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Languages</p>
              <p className="text-2xl font-semibold">
                {Object.keys(form.watch("marketingContent") || {}).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Characters</p>
              <p className="text-2xl font-semibold">
                {Object.values(form.watch("marketingContent") || {}).reduce((acc: number, content: unknown) => {
                  const typedContent = content as { 
                    title?: string; 
                    shortDescription?: string; 
                    longDescription?: string; 
                    tagline?: string 
                  }
                  return acc + (typedContent.title?.length || 0) + (typedContent.shortDescription?.length || 0) + 
                         (typedContent.longDescription?.length || 0) + (typedContent.tagline?.length || 0)
                }, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SEO Score</p>
              <p className="text-2xl font-semibold">
                {currentLanguageContent?.metaDescription && (currentLanguageContent?.seoKeywords?.length || 0) > 0 ? "Good" : "Needs Work"}
              </p>
            </div>
          </div>
        )}
        </div>
      </form>
    </PropertySection>
  )
}