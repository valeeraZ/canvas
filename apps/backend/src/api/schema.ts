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
    displayName: {
      description: "Display name returned by the upstream user profile service.",
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
  required: ["tenantId", "displayName", "externalUserId", "roles", "groups"]
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
    },
    uploadedByExternalUserId: {
      description: "External user identifier of the uploader.",
      type: "string"
    },
    uploadedByDisplayName: {
      description: "Display name of the uploader.",
      type: "string"
    },
    uploadedAt: {
      description: "ISO timestamp when the upload session was created.",
      type: "string"
    },
    sourceFilename: {
      description: "Original uploaded filename.",
      type: "string"
    },
    contentType: {
      description: "Uploaded file content type.",
      type: "string"
    },
    sizeBytes: {
      description: "Uploaded file size in bytes.",
      type: "number"
    },
    storageBucket: {
      description: "Object storage bucket for the uploaded source file.",
      type: "string"
    },
    storageObjectKey: {
      description: "Object storage key for the uploaded source file.",
      type: "string"
    },
    storageUploadId: {
      description: "Underlying object storage multipart upload identifier.",
      type: "string"
    },
    importStatus: {
      description: "Current import processing state for the source file.",
      type: "string"
    },
    usageSummary: {
      description: "Derived usage summary for dashboards, widgets, and workbooks that reference this dataset.",
      type: "object",
      properties: {
        dashboards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" }
            },
            required: ["id", "name"]
          }
        },
        widgets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              dashboardId: { type: "string" },
              dashboardName: { type: "string" },
              type: { type: "string" }
            },
            required: ["id", "dashboardId", "dashboardName", "type"]
          }
        },
        workbooks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" }
            },
            required: ["id", "name"]
          }
        }
      },
      required: ["dashboards", "widgets", "workbooks"]
    }
  },
  required: ["id", "name", "status", "warnings", "usageSummary"]
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
    },
    uploadUrl: {
      description: "Backend endpoint that accepts the full file upload for this session.",
      type: "string"
    }
  },
  required: ["bucket", "objectKey", "uploadUrl"]
} as const;

export const createUploadResponseSchema = {
  type: "object",
  description: "Dataset upload session creation result.",
  properties: {
    uploadId: {
      description: "Canvas upload session identifier.",
      type: "string"
    },
    upload: uploadSessionSchema,
    dataset: datasetSummarySchema
  },
  required: ["uploadId", "upload", "dataset"]
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

export const chartWidgetConfigSchema = {
  type: "object",
  description: "Chart widget configuration used by the dashboard editor.",
  properties: {
    datasetId: {
      type: "string",
      description: "Dataset identifier bound to the widget."
    },
    chartType: {
      type: "string",
      description: "Chart renderer type."
    },
    xField: {
      type: "string",
      description: "Field used as the x axis or category axis."
    },
    yField: {
      type: "string",
      description: "Field used as the value axis."
    },
    seriesField: {
      type: "string",
      description: "Optional field used to split multiple series."
    },
    title: {
      type: "string",
      description: "Optional widget title."
    }
  },
  required: ["datasetId", "chartType", "xField", "yField"]
} as const;

export const dashboardWidgetSchema = {
  type: "object",
  description: "Dashboard widget record scoped to the current app.",
  properties: {
    id: {
      type: "string",
      description: "Widget identifier."
    },
    tenantId: {
      type: "string",
      description: "App identifier owning the widget."
    },
    dashboardId: {
      type: "string",
      description: "Dashboard identifier owning the widget."
    },
    type: {
      type: "string",
      description: "Widget type."
    },
    datasetId: {
      type: ["string", "null"],
      description: "Dataset identifier bound to the widget."
    },
    config: {
      ...chartWidgetConfigSchema,
      type: ["object", "null"]
    }
  },
  required: ["id", "tenantId", "dashboardId", "type", "datasetId", "config"]
} as const;

export const datasetPreviewSchema = {
  type: "object",
  description: "Normalized dataset preview used by the dashboard editor.",
  properties: {
    datasetId: {
      type: "string",
      description: "Dataset identifier."
    },
    columns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string"
          },
          type: {
            type: "string"
          }
        },
        required: ["name", "type"]
      }
    },
    sampleRows: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    },
    records: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: true
      }
    }
  },
  required: ["datasetId", "columns", "sampleRows", "records"]
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
