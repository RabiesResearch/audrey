// Sample mock data for development

export interface Region {
  id: string;
  name: string;
  vaccineStock: number;
  bites: {
    lowRisk: number;
    highRisk: number;
    deaths: number;
  };
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  vaccineStock: number;
  bites: {
    lowRisk: number;
    highRisk: number;
    deaths: number;
  };
  healthFacilities: HealthFacility[];
}

export interface HealthFacility {
  id: string;
  name: string;
  vaccineStock: number;
  bites: {
    lowRisk: number;
    highRisk: number;
    deaths: number;
  };
}

export interface BiteCase {
  id: string;
  regionId: string;
  districtId: string;
  coordinates: [number, number]; // [longitude, latitude]
  riskLevel: "low" | "high" | "death";
  date: string; // ISO date string
}

// Generate some sample data
export const regions: Region[] = [
  {
    id: "arusha",
    name: "Arusha",
    vaccineStock: 280,
    bites: {
      lowRisk: 45,
      highRisk: 22,
      deaths: 3,
    },
    districts: [
      {
        id: "arusha-rural",
        name: "Arusha Rural",
        vaccineStock: 120,
        bites: {
          lowRisk: 20,
          highRisk: 10,
          deaths: 1,
        },
        healthFacilities: [
          {
            id: "arusha-hospital",
            name: "Arusha Regional Hospital",
            vaccineStock: 80,
            bites: {
              lowRisk: 12,
              highRisk: 6,
              deaths: 1,
            },
          },
          {
            id: "usa-river",
            name: "Usa River Health Center",
            vaccineStock: 40,
            bites: {
              lowRisk: 8,
              highRisk: 4,
              deaths: 0,
            },
          },
        ],
      },
      {
        id: "arusha-urban",
        name: "Arusha Urban",
        vaccineStock: 160,
        bites: {
          lowRisk: 25,
          highRisk: 12,
          deaths: 2,
        },
        healthFacilities: [
          {
            id: "mount-meru",
            name: "Mount Meru Hospital",
            vaccineStock: 100,
            bites: {
              lowRisk: 15,
              highRisk: 8,
              deaths: 1,
            },
          },
          {
            id: "selian",
            name: "Selian Lutheran Hospital",
            vaccineStock: 60,
            bites: {
              lowRisk: 10,
              highRisk: 4,
              deaths: 1,
            },
          },
        ],
      },
    ],
  },
  {
    id: "dar-es-salaam",
    name: "Dar es Salaam",
    vaccineStock: 520,
    bites: {
      lowRisk: 78,
      highRisk: 35,
      deaths: 5,
    },
    districts: [
      {
        id: "ilala",
        name: "Ilala",
        vaccineStock: 200,
        bites: {
          lowRisk: 30,
          highRisk: 15,
          deaths: 2,
        },
        healthFacilities: [
          {
            id: "muhimbili",
            name: "Muhimbili National Hospital",
            vaccineStock: 150,
            bites: {
              lowRisk: 20,
              highRisk: 10,
              deaths: 1,
            },
          },
          {
            id: "amana",
            name: "Amana Hospital",
            vaccineStock: 50,
            bites: {
              lowRisk: 10,
              highRisk: 5,
              deaths: 1,
            },
          },
        ],
      },
      {
        id: "kinondoni",
        name: "Kinondoni",
        vaccineStock: 180,
        bites: {
          lowRisk: 28,
          highRisk: 12,
          deaths: 2,
        },
        healthFacilities: [
          {
            id: "mwananyamala",
            name: "Mwananyamala Hospital",
            vaccineStock: 100,
            bites: {
              lowRisk: 18,
              highRisk: 8,
              deaths: 1,
            },
          },
          {
            id: "sinza",
            name: "Sinza Hospital",
            vaccineStock: 80,
            bites: {
              lowRisk: 10,
              highRisk: 4,
              deaths: 1,
            },
          },
        ],
      },
      {
        id: "temeke",
        name: "Temeke",
        vaccineStock: 140,
        bites: {
          lowRisk: 20,
          highRisk: 8,
          deaths: 1,
        },
        healthFacilities: [
          {
            id: "temeke-hospital",
            name: "Temeke Regional Hospital",
            vaccineStock: 80,
            bites: {
              lowRisk: 12,
              highRisk: 5,
              deaths: 1,
            },
          },
          {
            id: "kigamboni",
            name: "Kigamboni Health Center",
            vaccineStock: 60,
            bites: {
              lowRisk: 8,
              highRisk: 3,
              deaths: 0,
            },
          },
        ],
      },
    ],
  },
];

// Generate some bite cases with locations
export const biteCases: BiteCase[] = [
  {
    id: "1",
    regionId: "arusha",
    districtId: "arusha-rural",
    coordinates: [36.6944, -3.3869], // Arusha coordinates
    riskLevel: "high",
    date: "2025-04-20T14:30:00Z",
  },
  {
    id: "2",
    regionId: "arusha",
    districtId: "arusha-urban",
    coordinates: [36.7, -3.4],
    riskLevel: "death",
    date: "2025-04-22T09:15:00Z",
  },
  {
    id: "3",
    regionId: "dar-es-salaam",
    districtId: "ilala",
    coordinates: [39.2695, -6.8235], // Dar es Salaam coordinates
    riskLevel: "low",
    date: "2025-04-21T11:45:00Z",
  },
  {
    id: "4",
    regionId: "dar-es-salaam",
    districtId: "kinondoni",
    coordinates: [39.28, -6.8],
    riskLevel: "high",
    date: "2025-04-23T16:20:00Z",
  },
  {
    id: "5",
    regionId: "dar-es-salaam",
    districtId: "temeke",
    coordinates: [39.27, -6.85],
    riskLevel: "death",
    date: "2025-04-24T08:10:00Z",
  },
];

// Function to get all regions
export function getAllRegions(): Region[] {
  return regions;
}

// Function to get a specific region
export function getRegion(id: string): Region | undefined {
  return regions.find((region) => region.id === id);
}

// Function to get all bite cases
export function getAllBiteCases(): BiteCase[] {
  return biteCases;
}

// Function to get bite cases for a specific region
export function getBiteCasesByRegion(regionId: string): BiteCase[] {
  return biteCases.filter((biteCase) => biteCase.regionId === regionId);
}
