"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { ChevronRight, Search, MapPin, Check, Minus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
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

interface DestinationTreeProps {
  destinations: Record<string, DestinationOption[]>
  selectedDestinations: string[]
  onSelectionChange: (destinations: string[]) => void
  className?: string
}

export function DestinationTree({
  destinations,
  selectedDestinations,
  onSelectionChange,
  className,
}: DestinationTreeProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // Transform flat destinations into hierarchical structure
  const treeData = useMemo(() => {
    const tree: DestinationNode[] = []
    const countryMap = new Map<string, DestinationNode>()
    const regionMap = new Map<string, Map<string, DestinationNode>>()

    // Group destinations by country and region
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
          // Handle region level
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

          // Add city as child of region
          regionNode.children!.push({
            id: dest.id,
            name: dest.name,
            type: "city",
            propertyCount: dest.propertyCount,
            parentId: regionNode.id,
          })
        } else {
          // Direct city under country (no region)
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

  // Check if a node is selected (all descendants selected)
  const isNodeSelected = useCallback((node: DestinationNode): boolean => {
    if (node.type === "city") {
      return selectedDestinations.includes(node.id)
    }
    
    const descendantIds = getDescendantIds(node)
    return descendantIds.length > 0 && descendantIds.every(id => selectedDestinations.includes(id))
  }, [selectedDestinations, getDescendantIds])

  // Check if a node is partially selected (some descendants selected)
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

  // Expand all nodes that contain selected destinations
  useEffect(() => {
    if (selectedDestinations.length === 0) return

    const nodesToExpand: string[] = []
    
    const checkNode = (node: DestinationNode) => {
      if (node.children) {
        const hasSelectedDescendant = node.children.some(child => {
          if (child.type === "city" && selectedDestinations.includes(child.id)) {
            return true
          }
          if (child.children) {
            return checkNode(child)
          }
          return false
        })
        
        if (hasSelectedDescendant) {
          nodesToExpand.push(node.id)
          return true
        }
      }
      return false
    }

    filteredTree.forEach(node => checkNode(node))
    setExpandedItems(prev => [...new Set([...prev, ...nodesToExpand])])
  }, [selectedDestinations, filteredTree])

  // Render tree node
  const renderNode = (node: DestinationNode, level: number = 0) => {
    const isSelected = isNodeSelected(node)
    const isPartiallySelected = isNodePartiallySelected(node)
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
      return (
        <AccordionItem key={node.id} value={node.id} className="border-b-0">
          <div className="flex items-center gap-2">
            <Checkbox
              id={node.id}
              checked={isSelected || isPartiallySelected}
              onCheckedChange={(checked) => handleNodeSelection(node, checked as boolean)}
              className={cn(
                "ml-2",
                isPartiallySelected && !isSelected && "opacity-50"
              )}
            />
            <AccordionTrigger 
              className={cn(
                "flex-1 py-3 hover:no-underline",
                level === 0 && "font-semibold text-base",
                level === 1 && "pl-4 text-sm",
                level === 2 && "pl-8 text-sm"
              )}
            >
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-2">
                  {node.type === "country" && <MapPin className="h-4 w-4" />}
                  <span>{node.name}</span>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {node.propertyCount}
                </Badge>
              </div>
            </AccordionTrigger>
          </div>
          <AccordionContent>
            {node.children?.map(child => renderNode(child, level + 1))}
          </AccordionContent>
        </AccordionItem>
      )
    }

    return (
      <div
        key={node.id}
        className={cn(
          "flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-md cursor-pointer",
          level === 0 && "font-semibold",
          level === 1 && "pl-6 text-sm",
          level === 2 && "pl-10 text-sm"
        )}
        onClick={() => handleNodeSelection(node, !isSelected)}
      >
        <Checkbox
          id={node.id}
          checked={isSelected}
          onCheckedChange={(checked) => handleNodeSelection(node, checked as boolean)}
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex items-center justify-between flex-1">
          <span>{node.name}</span>
          <Badge variant="secondary" className="text-xs">
            {node.propertyCount}
          </Badge>
        </div>
      </div>
    )
  }

  // Handle expand/collapse all
  const handleExpandAll = () => {
    const allNodeIds = treeData.flatMap(node => {
      const ids = [node.id]
      if (node.children) {
        ids.push(...node.children.map(child => child.id))
      }
      return ids
    })
    setExpandedItems(allNodeIds)
  }

  const handleCollapseAll = () => {
    setExpandedItems([])
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search destinations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandAll}
              className="text-xs"
            >
              Expand All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCollapseAll}
              className="text-xs"
            >
              Collapse All
            </Button>
          </div>
          {selectedDestinations.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
              className="text-xs"
            >
              Clear ({selectedDestinations.length})
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-2">
          {filteredTree.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No destinations found" : "No destinations available"}
            </div>
          ) : (
            <Accordion 
              type="multiple" 
              value={expandedItems}
              onValueChange={setExpandedItems}
              className="w-full"
            >
              <AnimatePresence>
                {filteredTree.map(node => renderNode(node))}
              </AnimatePresence>
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {selectedDestinations.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Selected destinations ({selectedDestinations.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {selectedDestinations.slice(0, 5).map(id => {
              const dest = Object.values(destinations)
                .flat()
                .find(d => d.id === id)
              return dest ? (
                <Badge key={id} variant="secondary" className="text-xs">
                  {dest.name}
                </Badge>
              ) : null
            })}
            {selectedDestinations.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{selectedDestinations.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}