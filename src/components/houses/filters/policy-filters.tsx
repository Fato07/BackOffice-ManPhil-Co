import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"

interface PolicyFilterOptions {
  petsAllowed?: boolean
  eventsAllowed?: boolean
  smokingAllowed?: boolean
}

interface PolicyFiltersProps {
  policies?: PolicyFilterOptions
  onPolicyChange: (policies?: PolicyFilterOptions) => void
  className?: string
}

export function PolicyFilters({
  policies,
  onPolicyChange,
  className
}: PolicyFiltersProps) {
  const handlePolicyChange = (
    policyKey: keyof PolicyFilterOptions,
    value: string
  ) => {
    if (value === "all") {
      const newPolicies = { ...policies }
      delete newPolicies[policyKey]
      const hasRemainingPolicies = Object.keys(newPolicies).length > 0
      onPolicyChange(hasRemainingPolicies ? newPolicies : undefined)
    } else {
      onPolicyChange({
        ...policies,
        [policyKey]: value === "yes"
      })
    }
  }

  const PolicyRadioGroup = ({
    label,
    policyKey,
    value
  }: {
    label: string
    policyKey: keyof PolicyFilterOptions
    value?: boolean
  }) => {
    const radioValue = value === true ? "yes" : value === false ? "no" : "all"
    const groupId = `policy-${policyKey}`

    return (
      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <RadioGroup
          value={radioValue}
          onValueChange={(value) => handlePolicyChange(policyKey, value)}
        >
          <label htmlFor={`${groupId}-all`} className="flex items-center gap-2 cursor-pointer py-1">
            <RadioGroupItem value="all" id={`${groupId}-all`} className="h-4 w-4" />
            <span className="text-sm">All</span>
          </label>
          <label htmlFor={`${groupId}-yes`} className="flex items-center gap-2 cursor-pointer py-1">
            <RadioGroupItem value="yes" id={`${groupId}-yes`} className="h-4 w-4" />
            <span className="text-sm">Yes</span>
          </label>
          <label htmlFor={`${groupId}-no`} className="flex items-center gap-2 cursor-pointer py-1">
            <RadioGroupItem value="no" id={`${groupId}-no`} className="h-4 w-4" />
            <span className="text-sm">No</span>
          </label>
        </RadioGroup>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm text-muted-foreground">Policies</Label>
      
      <PolicyRadioGroup
        label="Pets Allowed"
        policyKey="petsAllowed"
        value={policies?.petsAllowed}
      />
      
      <PolicyRadioGroup
        label="Events Allowed"
        policyKey="eventsAllowed"
        value={policies?.eventsAllowed}
      />
      
      <PolicyRadioGroup
        label="Smoking Allowed"
        policyKey="smokingAllowed"
        value={policies?.smokingAllowed}
      />
    </div>
  )
}