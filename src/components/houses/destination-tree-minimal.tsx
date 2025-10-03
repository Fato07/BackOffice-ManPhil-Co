"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { ChevronRight, Search, X, MapPin } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { type DestinationOption } from "@/hooks/use-destinations"

interface DestinationNode {
  id: string
  name: string
  type: "country" | "region" | "city"
  propertyCount: number
  children?: DestinationNode[]
  parentId?: string
}

interface DestinationTreeMinimalProps {
  destinations: Record<string, DestinationOption[]>
  selectedDestinations: string[]
  onSelectionChange: (destinations: string[]) => void
  className?: string
}

export function DestinationTreeMinimal({
  destinations,
  selectedDestinations,
  onSelectionChange,
  className,
}: DestinationTreeMinimalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Transform flat destinations into hierarchical structure
  const treeData = useMemo(() => {
    const tree: DestinationNode[] = []
    const countryMap = new Map<string, DestinationNode>()
    const regionMap = new Map<string, Map<string, DestinationNode>>()

    Object.entries(destinations).forEach(([country, destinationList]) => {
      if (!countryMap.has(country)) {
        countryMap.set(country, {
          id: `country-${country}`,
          name: country,
          type: "country",
          propertyCount: 0,
          children: [],
        })
      }

      const countryNode = countryMap.get(country)!
      
      destinationList.forEach((dest) => {
        countryNode.propertyCount += dest.propertyCount

        if (dest.region) {
          if (!regionMap.has(country)) {
            regionMap.set(country, new Map())
          }
          
          const countryRegions = regionMap.get(country)!
          
          if (!countryRegions.has(dest.region)) {
            const regionNode: DestinationNode = {
              id: `region-${country}-${dest.region}`,
              name: dest.region,
              type: "region",
              propertyCount: 0,
              children: [],
              parentId: countryNode.id,
            }
            countryRegions.set(dest.region, regionNode)
            countryNode.children!.push(regionNode)
          }

          const regionNode = countryRegions.get(dest.region)!
          regionNode.propertyCount += dest.propertyCount

          regionNode.children!.push({
            id: dest.id,
            name: dest.name,
            type: "city",
            propertyCount: dest.propertyCount,
            parentId: regionNode.id,
          })
        } else {
          countryNode.children!.push({
            id: dest.id,
            name: dest.name,
            type: "city",
            propertyCount: dest.propertyCount,
            parentId: countryNode.id,
          })
        }
      })

      tree.push(countryNode)
    })

    return tree
  }, [destinations])

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery) return treeData

    const query = searchQuery.toLowerCase()
    
    const filterNode = (node: DestinationNode): DestinationNode | null => {
      const nodeMatches = node.name.toLowerCase().includes(query)
      
      if (node.children) {
        const filteredChildren = node.children
          .map(child => filterNode(child))
          .filter(Boolean) as DestinationNode[]
        
        if (filteredChildren.length > 0 || nodeMatches) {
          return { ...node, children: filteredChildren }
        }
      } else if (nodeMatches) {
        return node
      }
      
      return null
    }

    return treeData
      .map(node => filterNode(node))
      .filter(Boolean) as DestinationNode[]
  }, [treeData, searchQuery])

  // Get all descendant IDs for a node
  const getDescendantIds = useCallback((node: DestinationNode): string[] => {
    const ids: string[] = []
    
    if (node.type === "city") {
      ids.push(node.id)
    }
    
    if (node.children) {
      node.children.forEach(child => {
        ids.push(...getDescendantIds(child))
      })
    }
    
    return ids
  }, [])

  // Check if a node is selected
  const isNodeSelected = useCallback((node: DestinationNode): boolean => {
    if (node.type === "city") {
      return selectedDestinations.includes(node.id)
    }
    
    const descendantIds = getDescendantIds(node)
    return descendantIds.length > 0 && descendantIds.every(id => selectedDestinations.includes(id))
  }, [selectedDestinations, getDescendantIds])

  // Check if a node is partially selected
  const isNodePartiallySelected = useCallback((node: DestinationNode): boolean => {
    if (node.type === "city") {
      return false
    }
    
    const descendantIds = getDescendantIds(node)
    const selectedCount = descendantIds.filter(id => selectedDestinations.includes(id)).length
    
    return selectedCount > 0 && selectedCount < descendantIds.length
  }, [selectedDestinations, getDescendantIds])

  // Handle node selection
  const handleNodeSelection = useCallback((node: DestinationNode, checked: boolean) => {
    const descendantIds = getDescendantIds(node)
    
    if (checked) {
      const newSelections = [...new Set([...selectedDestinations, ...descendantIds])]
      onSelectionChange(newSelections)
    } else {
      const newSelections = selectedDestinations.filter(id => !descendantIds.includes(id))
      onSelectionChange(newSelections)
    }
  }, [selectedDestinations, onSelectionChange, getDescendantIds])

  // Toggle expansion
  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  // Expand nodes with selected destinations on mount
  useEffect(() => {
    if (selectedDestinations.length === 0) return

    const nodesToExpand = new Set<string>()
    
    const checkNode = (node: DestinationNode): boolean => {
      let hasSelectedDescendant = false
      
      if (node.type === "city" && selectedDestinations.includes(node.id)) {
        return true
      }
      
      if (node.children) {
        for (const child of node.children) {
          if (checkNode(child)) {
            hasSelectedDescendant = true
            nodesToExpand.add(node.id)
          }
        }
      }
      
      return hasSelectedDescendant
    }

    filteredTree.forEach(node => checkNode(node))
    setExpandedItems(nodesToExpand)
  }, [selectedDestinations, filteredTree])

  // Render tree node
  const renderNode = (node: DestinationNode, level: number = 0) => {
    const isSelected = isNodeSelected(node)
    const isPartiallySelected = isNodePartiallySelected(node)
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expandedItems.has(node.id)

    return (
      <div key={node.id}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "group flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer transition-colors",
            "hover:bg-muted/50",
            isSelected && "bg-muted/30",
            level === 0 && "font-medium",
            level === 1 && "ml-6 text-sm",
            level === 2 && "ml-10 text-sm text-muted-foreground"
          )}
          onClick={() => handleNodeSelection(node, !isSelected)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(node.id)
              }}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              <ChevronRight 
                className={cn(
                  "h-3 w-3 transition-transform",
                  isExpanded && "rotate-90"
                )} 
              />
            </button>
          )}
          {!hasChildren && <div className="w-4" />}

          <Checkbox
            checked={isSelected || isPartiallySelected}
            onCheckedChange={(checked) => handleNodeSelection(node, checked as boolean)}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "h-4 w-4",
              isPartiallySelected && !isSelected && "opacity-50"
            )}
          />

          {node.type === "country" && (
            <MapPin className="h-3 w-3 text-muted-foreground" />
          )}

          <span className="flex-1">{node.name}</span>

          <span className="text-xs text-muted-foreground">
            {node.propertyCount}
          </span>
        </motion.div>

        {hasChildren && isExpanded && node.children && (
          <AnimatePresence>
            {node.children.map(child => renderNode(child, level + 1))}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search destinations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 pr-8 h-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 hover:bg-muted rounded"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const allNodeIds = new Set<string>()
              treeData.forEach(node => {
                allNodeIds.add(node.id)
                if (node.children) {
                  node.children.forEach(child => {
                    allNodeIds.add(child.id)
                  })
                }
              })
              setExpandedItems(allNodeIds)
            }}
            className="h-7 text-xs px-2"
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedItems(new Set())}
            className="h-7 text-xs px-2"
          >
            Collapse All
          </Button>
        </div>
        
        {selectedDestinations.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedDestinations.length} selected
          </Badge>
        )}
      </div>

      <div className="space-y-0.5">
        {filteredTree.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {searchQuery ? "No destinations found" : "No destinations available"}
          </div>
        ) : (
          filteredTree.map(node => renderNode(node))
        )}
      </div>

      {selectedDestinations.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected destinations</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="h-6 text-xs px-2 hover:text-destructive"
            >
              Clear all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(() => {
              const visibleDestinations = selectedDestinations.slice(0, 3)
              const remainingCount = selectedDestinations.length - 3
              
              return (
                <>
                  {visibleDestinations.map(id => {
                    // Find the destination name from the tree data
                    let destName = ""
                    const findDestination = (nodes: DestinationNode[]): boolean => {
                      for (const node of nodes) {
                        if (node.type === "city" && node.id === id) {
                          destName = node.name
                          return true
                        }
                        if (node.children && findDestination(node.children)) {
                          return true
                        }
                      }
                      return false
                    }
                    
                    findDestination(treeData)
                    
                    if (!destName) return null
                    
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs h-6"
                      >
                        {destName}
                        <button
                          onClick={() => {
                            const newSelections = selectedDestinations.filter(did => did !== id)
                            onSelectionChange(newSelections)
                          }}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                  {remainingCount > 0 && (
                    <Badge variant="secondary" className="text-xs h-6">
                      +{remainingCount} more
                    </Badge>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}