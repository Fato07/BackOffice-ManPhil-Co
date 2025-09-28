import { EquipmentType, RoomType, AccessibilityType, ContactType } from "@/generated/prisma"

// Equipment categorization for better UI organization - based on list.txt
export const EQUIPMENT_CATEGORIES: Record<string, { label: string; items: EquipmentType[] }> = {
  KITCHEN: {
    label: "Kitchen Equipment",
    items: [
      "DISHWASHER", "GAS_COOKER", "INDUCTION_HOB", "MICROWAVE_OVEN", "PROFESSIONAL_OVEN",
      "PIZZA_OVEN", "TOASTER", "FILTER_COFFEE_MACHINE", "KETTLE", "JUICER", "BLENDER_MIXER",
      "TURNTABLE", "KITCHEN_ISLAND", "RANGE_HOOD", "FRIDGE", "AMERICAN_FRIDGE", "FREEZER",
      "ICE_CUBE_MAKER", "ICE_CREAM_SORBET_MACHINE", "OVEN", "SANDWICH_MAKER", "THERMOMIX",
      "DEEP_FRYER", "RICE_COOKER", "FOOD_PROCESSOR", "BEAN_TO_CUP_COFFEE_MACHINE",
      "COFFEE_POD_MACHINE", "RACLETTE_MACHINE", "FONDUE_MACHINE", "WAFFLE_MACHINE",
      "POPCORN_MACHINE", "KITCHENETTE", "DELI_SLICER", "STEAMER", "COMBINED_GAS_INDUCTION_STOVE",
      "SODASTREAM", "WINE_GLASS", "CHAMPAGNE_GLASS", "BAR", "BEER_TAP"
    ] as EquipmentType[]
  },
  BATHROOM: {
    label: "Bathroom Equipment",
    items: [
      "TOILET", "BATHTUB", "SHOWER", "WALK_IN_SHOWER", "OUTDOOR_SHOWER", "JACUZZI_BATHTUB",
      "HAMMAM_SHOWER", "SINGLE_BASIN_SINK", "DOUBLE_BASIN_SINK", "MAGNIFYING_MIRROR",
      "TOILET_NOT_IN_BATHROOM", "ACCESSIBLE_TOILETS", "HAMMAM", "SAUNA", "COLD_WATER_BATH"
    ] as EquipmentType[]
  },
  FURNITURE: {
    label: "Furniture",
    items: [
      "SOFA", "CHAIR", "ARMCHAIR", "DOUBLE_BED", "SINGLE_BED", "DOUBLE_BED_TWIN_BEDS",
      "BUNK_BEDS", "SOFA_BED", "SOFA_BED_SINGLE", "DESK", "STORAGE_CUPBOARD", "WALK_IN_CLOSET",
      "SAFE", "MASSAGE_TABLE", "LIBRARY"
    ] as EquipmentType[]
  },
  ENTERTAINMENT: {
    label: "Entertainment",
    items: [
      "SMART_TV", "FLAT_SCREEN_TV", "TV", "DVD_PLAYER", "DVD_LIBRARY", "GAMING_CONSOLE",
      "VIDEO_PROJECTOR", "SOUND_SYSTEM", "PIANO", "DJ_SET", "CHESS_BOARD", "BOARD_GAMES",
      "DARTS_SET", "TABLE_FOOTBALL", "BILLIARD_TABLE", "PING_PONG_TABLE", "TURNTABLE"
    ] as EquipmentType[]
  },
  FITNESS: {
    label: "Fitness Equipment",
    items: [
      "TREADMILL", "CYCLE", "ROWING_MACHINE", "DUMBBELLS", "FITNESS_EQUIPMENT", "TRAMPOLINE"
    ] as EquipmentType[]
  },
  OUTDOOR: {
    label: "Outdoor Equipment",
    items: [
      "SWIMMING_POOL", "CHILDREN_POOL", "JACUZZI", "BARBECUE", "GRILL", "HAMMOCK", "SUNBED",
      "DOUBLE_SUNBED", "SOLARIUM", "PARASOL", "PERGOLA", "TERRACE", "SHARED_TERRACE",
      "SWING", "TREE_HOUSE", "SEESAW", "FOUNTAIN", "POND", "FIRE_PIT", "PUTTING_GREEN",
      "CROQUET", "CRICKET_PITCH", "VINEYARD", "VEGETABLE_GARDEN", "OBSERVATORY", "HELIPAD",
      "MOORING", "PIER", "CHILDREN_SLIDE", "CHILDREN_PLAYHOUSE", "TENT", "BERBER_TENT"
    ] as EquipmentType[]
  },
  CLIMATE: {
    label: "Climate Control",
    items: [
      "AIR_CONDITIONING", "REVERSIBLE_AIR_CONDITIONING", "CEILING_FAN", "FAN", "FIREPLACE",
      "NORDIC_BATH", "HEATED_BOOT_WARMER"
    ] as EquipmentType[]
  },
  APPLIANCES: {
    label: "Appliances",
    items: [
      "WASHING_MACHINE", "TUMBLE_DRYER", "IRON", "IRONING_BOARD", "DISHWASHER"
    ] as EquipmentType[]
  },
  SPORTS: {
    label: "Sports Equipment",
    items: [
      "SKI_RACKS", "SLEDGE", "GLOVE_DRYERS"
    ] as EquipmentType[]
  },
  MISCELLANEOUS: {
    label: "Other Equipment",
    items: [
      "WINE_CELLAR", "TELEPHONE", "COMPUTER", "PRINTER", "SCANNER",
      "JACK_CABLE", "CHILDREN_GAMES"
    ] as EquipmentType[]
  }
}

// Room type categorization
export const ROOM_CATEGORIES = {
  LIVING_SPACES: {
    label: "Living Spaces",
    items: [
      "LIVING_ROOM", "DINING_ROOM", "KITCHEN", "TV_ROOM", "GAMING_ROOM", "MUSIC_ROOM", 
      "LIBRARY", "OFFICE_ROOM", "CONFERENCE_ROOM"
    ] as RoomType[]
  },
  BEDROOMS: {
    label: "Bedrooms",
    items: [
      "BEDROOM", "BEDROOM_FOR_CHILDREN", "BEDROOM_FOR_STAFF", "SUITE", "DORMITORY",
      "WINDOWLESS_BEDROOM", "SLEEPING_SLUG", "VIP"
    ] as RoomType[]
  },
  BATHROOMS: {
    label: "Bathrooms",
    items: ["BATHROOM", "RESTROOM", "DRESSING_ROOM"] as RoomType[]
  },
  ENTERTAINMENT: {
    label: "Entertainment",
    items: [
      "MOVIE_ROOM", "GAMING_ROOM", "MUSIC_ROOM", "BAR", "BILLBOARD_ROOM", "TV_ROOM"
    ] as RoomType[]
  },
  WELLNESS: {
    label: "Wellness & Spa",
    items: [
      "SPA", "MASSAGE_ROOM", "MEDITATION_ROOM", "RELAXATION_ROOM", "FITNESS_ROOM", "SAUNA"
    ] as RoomType[]
  },
  OUTDOOR: {
    label: "Outdoor Spaces",
    items: [
      "TERRACE", "COVERED_TERRACE", "GARDEN", "COURTYARD", "ROOFTOP", "VERANDA",
      "POOL_AREA", "POOLHOUSE"
    ] as RoomType[]
  },
  SPORTS: {
    label: "Sports Facilities",
    items: [
      "TENNIS_COURT", "BADMINTON_COURT", "BASKETBALL_COURT", "FOOTBALL_COURT",
      "VOLLEYBALL_COURT", "PADEL_COURT", "PETANQUE", "FITNESS_ROOM"
    ] as RoomType[]
  },
  UTILITY: {
    label: "Utility Rooms",
    items: [
      "LAUNDRY_ROOM", "STORAGE_ROOM", "COLD_CHAMBER", "WINE_CELLAR", "CIGAR_CELL",
      "SMOKEHOUSE", "SKIROOM"
    ] as RoomType[]
  }
} as const

// Property categories
export const PROPERTY_CATEGORIES = [
  { value: "City", label: "City", description: "Urban properties in city centers" },
  { value: "Countryside", label: "Countryside", description: "Rural properties in natural settings" },
  { value: "Mountain", label: "Mountain", description: "Properties in mountainous regions" },
  { value: "Sea", label: "Sea", description: "Coastal and beachfront properties" }
] as const

// Accessibility options with labels
export const ACCESSIBILITY_OPTIONS = [
  { value: "BY_CAR" as AccessibilityType, label: "By Car", description: "Accessible by car/vehicle" },
  { value: "SKI_IN_SKI_OUT" as AccessibilityType, label: "Ski In/Ski Out", description: "Direct ski slope access" },
  { value: "BY_FOOT" as AccessibilityType, label: "By Foot", description: "Walking access only" }
] as const

// Contact types with descriptions
export const CONTACT_TYPES = [
  { value: "OWNER" as ContactType, label: "Owner", description: "Property owner" },
  { value: "MANAGER" as ContactType, label: "Manager", description: "Property manager" },
  { value: "AGENCY" as ContactType, label: "Agency", description: "Managing agency" },
  { value: "STAFF" as ContactType, label: "Staff", description: "Property staff member" },
  { value: "MAINTENANCE" as ContactType, label: "Maintenance", description: "Maintenance contact" },
  { value: "EMERGENCY" as ContactType, label: "Emergency", description: "Emergency contact" },
  { value: "CHECK_IN_MANAGER" as ContactType, label: "Check-in Manager", description: "Handles guest check-ins" },
  { value: "SECURITY_DEPOSIT_MANAGER" as ContactType, label: "Security Deposit Manager", description: "Manages security deposits" },
  { value: "SIGNATORY" as ContactType, label: "Signatory", description: "Authorized to sign documents" },
  { value: "HOUSEKEEPING" as ContactType, label: "Housekeeping", description: "Housekeeping service provider" },
  { value: "GARDENING" as ContactType, label: "Gardening", description: "Garden maintenance service" },
  { value: "POOL_MAINTENANCE" as ContactType, label: "Pool Maintenance", description: "Pool cleaning and maintenance" },
  { value: "CHECK_IN_STAFF" as ContactType, label: "Check-in Staff", description: "Staff responsible for check-ins" }
] as const

// Helper functions
export function getEquipmentsByCategory(category: keyof typeof EQUIPMENT_CATEGORIES): EquipmentType[] {
  return EQUIPMENT_CATEGORIES[category].items
}

export function getRoomsByCategory(category: keyof typeof ROOM_CATEGORIES): RoomType[] {
  return ROOM_CATEGORIES[category].items
}

export function getEquipmentLabel(equipment: EquipmentType): string {
  return equipment.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export function getRoomTypeLabel(roomType: RoomType): string {
  return roomType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export function getAccessibilityLabel(accessibility: AccessibilityType): string {
  const option = ACCESSIBILITY_OPTIONS.find(opt => opt.value === accessibility)
  return option?.label || accessibility.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

export function getContactTypeLabel(contactType: ContactType): string {
  const type = CONTACT_TYPES.find(t => t.value === contactType)
  return type?.label || contactType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

// Categorize room types as interior or outdoor
export function isOutdoorRoom(roomType: RoomType): boolean {
  const outdoorRoomTypes: RoomType[] = [
    RoomType.BADMINTON_COURT,
    RoomType.BASKETBALL_COURT,
    RoomType.COURTYARD,
    RoomType.COVERED_TERRACE,
    RoomType.FOOTBALL_COURT,
    RoomType.GARDEN,
    RoomType.PADEL_COURT,
    RoomType.PETANQUE,
    RoomType.POOL_AREA,
    RoomType.POOLHOUSE,
    RoomType.ROOFTOP,
    RoomType.TENNIS_COURT,
    RoomType.TERRACE,
    RoomType.VERANDA,
    RoomType.VOLLEYBALL_COURT,
  ]
  
  return outdoorRoomTypes.includes(roomType)
}

export function getRoomTypeCategory(roomType: RoomType): "INTERIOR" | "OUTDOOR" {
  return isOutdoorRoom(roomType) ? "OUTDOOR" : "INTERIOR"
}