export const messageResponseSchema = {
  type: "object",
  description: "Standard error response payload.",
  properties: {
    message: {
      description: "Human-readable error message.",
      type: "string"
    }
  },
  required: ["message"]
} as const;

export const tenantContextSchema = {
  type: "object",
  description: "Resolved app-scoped principal context for the current request.",
  properties: {
    tenantId: {
      description: "Active app identifier stored in the Canvas server session.",
      type: "string"
    },
    externalUserId: {
      description: "External user identifier returned by the upstream authorization service.",
      type: "string"
    },
    roles: {
      description: "Effective external roles for the current principal in the active app.",
      type: "array",
      items: {
        type: "string"
      }
    },
    groups: {
      description: "Effective external groups associated with the current principal.",
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: ["tenantId", "externalUserId", "roles", "groups"]
} as const;

export const sessionExchangeResponseSchema = {
  type: "object",
  description: "Session bootstrap payload returned after resolving an amtoken into a Canvas server session.",
  properties: {
    expiresIn: {
      description: "Session lifetime in seconds.",
      type: "number"
    },
    selectedApp: {
      description: "App that was written into the Canvas server-side session.",
      type: "string"
    },
    principal: {
      description: "Principal snapshot resolved from external authorization APIs.",
      type: "object",
      properties: {
        employeeId: {
          description: "External employee or user identifier.",
          type: "string"
        },
        displayName: {
          description: "Display name returned by the upstream user profile service.",
          type: "string"
        },
        roles: {
          description: "App-scoped external roles for the selected app.",
          type: "array",
          items: {
            type: "string"
          }
        }
      },
      required: ["employeeId", "displayName", "roles"]
    }
  },
  required: ["expiresIn", "selectedApp", "principal"]
} as const;

export const selectAppResponseSchema = {
  type: "object",
  description: "Active app selection result for the current Canvas server session.",
  properties: {
    tenantId: {
      description: "Newly selected app identifier.",
      type: "string"
    },
    roles: {
      description: "Resolved external roles for the newly selected app.",
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: ["tenantId", "roles"]
} as const;

export const accessibleAppsResponseSchema = {
  type: "object",
  description: "Accessible app inventory resolved from the upstream authorization service.",
  properties: {
    principal: {
      type: "object",
      description: "Principal identity shared across all accessible apps.",
      properties: {
        displayName: {
          type: "string",
          description: "Display name returned by the upstream current user endpoint."
        },
        employeeId: {
          type: "string",
          description: "External employee or user identifier."
        }
      },
      required: ["displayName", "employeeId"]
    },
    apps: {
      type: "array",
      description: "All apps the current principal can access.",
      items: {
        type: "object",
        properties: {
          appName: {
            type: "string",
            description: "App identifier returned by the upstream authorization service."
          },
          roles: {
            type: "array",
            description: "Effective roles for the current principal in this app.",
            items: {
              type: "string"
            }
          }
        },
        required: ["appName", "roles"]
      }
    }
  },
  required: ["principal", "apps"]
} as const;

export const datasetSummarySchema = {
  type: "object",
  description: "Dataset summary shown in app-scoped dataset lists.",
  properties: {
    id: {
      description: "Dataset identifier.",
      type: "string"
    },
    name: {
      description: "Dataset display name.",
      type: "string"
    },
    status: {
      description: "Current ingestion status for the dataset.",
      type: "string"
    },
    warningCount: {
      description: "Count of ingestion warnings associated with the dataset.",
      type: "number"
    }
  },
  required: ["id", "name", "status", "warningCount"]
} as const;

export const datasetDetailSchema = {
  type: "object",
  description: "Full dataset detail payload.",
  properties: {
    id: {
      description: "Dataset identifier.",
      type: "string"
    },
    name: {
      description: "Dataset display name.",
      type: "string"
    },
    status: {
      description: "Current ingestion status for the dataset.",
      type: "string"
    },
    warnings: {
      description: "Detailed warning list generated during ingestion.",
      type: "array",
      items: {
        type: "object",
        properties: {
          code: {
            description: "Stable warning code.",
            type: "string"
          },
          message: {
            description: "Optional human-readable warning detail.",
            type: "string"
          }
        },
        required: ["code"]
      }
    }
  },
  required: ["id", "name", "status", "warnings"]
} as const;

export const uploadSessionSchema = {
  type: "object",
  description: "Storage destination for a dataset upload.",
  properties: {
    bucket: {
      description: "Target storage bucket.",
      type: "string"
    },
    objectKey: {
      description: "Target object key inside the bucket.",
      type: "string"
    }
  },
  required: ["bucket", "objectKey"]
} as const;

export const createUploadResponseSchema = {
  type: "object",
  description: "Dataset upload session creation result.",
  properties: {
    upload: uploadSessionSchema,
    dataset: datasetSummarySchema
  },
  required: ["upload", "dataset"]
} as const;

export const workbookSchema = {
  type: "object",
  description: "Workbook record scoped to the current app.",
  properties: {
    id: {
      description: "Workbook identifier.",
      type: "string"
    },
    tenantId: {
      description: "App identifier owning the workbook.",
      type: "string"
    },
    name: {
      description: "Workbook display name.",
      type: "string"
    }
  },
  required: ["id", "tenantId", "name"]
} as const;

export const dashboardSchema = {
  type: "object",
  description: "Dashboard record scoped to the current app.",
  properties: {
    id: {
      description: "Dashboard identifier.",
      type: "string"
    },
    tenantId: {
      description: "App identifier owning the dashboard.",
      type: "string"
    },
    name: {
      description: "Dashboard display name.",
      type: "string"
    },
    workbookId: {
      description: "Workbook identifier backing the dashboard, or null when unassigned.",
      type: ["string", "null"]
    }
  },
  required: ["id", "tenantId", "name", "workbookId"]
} as const;

export const selectedDashboardSchema = {
  type: "object",
  description: "Per-user selected dashboard for the active app.",
  properties: {
    dashboardId: {
      description: "Selected dashboard identifier, or null when no preference is stored.",
      type: ["string", "null"]
    }
  },
  required: ["dashboardId"]
} as const;

export const dashboardExportPackageSchema = {
  type: "object",
  description: "Portable dashboard package used for lightweight export and import flows.",
  properties: {
    version: {
      description: "Contract version for dashboard portability payloads.",
      type: "number"
    },
    dashboard: {
      type: "object",
      description: "Portable dashboard metadata.",
      properties: {
        name: {
          description: "Dashboard display name.",
          type: "string"
        },
        workbookId: {
          description: "Optional workbook identifier preserved in the export package.",
          type: ["string", "null"]
        }
      },
      required: ["name", "workbookId"]
    },
    shareSubjects: {
      type: "array",
      description: "Explicit visibility subjects included in the package.",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string"
          },
          id: {
            type: "string"
          }
        },
        required: ["type", "id"]
      }
    }
  },
  required: ["version", "dashboard", "shareSubjects"]
} as const;
