export const messageResponseSchema = {
  type: "object",
  properties: {
    message: {
      type: "string"
    }
  },
  required: ["message"]
} as const;

export const tenantContextSchema = {
  type: "object",
  properties: {
    tenantId: {
      type: "string"
    },
    externalUserId: {
      type: "string"
    },
    roles: {
      type: "array",
      items: {
        type: "string"
      }
    },
    groups: {
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
  properties: {
    expiresIn: {
      type: "number"
    },
    selectedApp: {
      type: "string"
    },
    principal: {
      type: "object",
      properties: {
        employeeId: {
          type: "string"
        },
        displayName: {
          type: "string"
        },
        roles: {
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
  properties: {
    tenantId: {
      type: "string"
    },
    roles: {
      type: "array",
      items: {
        type: "string"
      }
    }
  },
  required: ["tenantId", "roles"]
} as const;

export const datasetSummarySchema = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    name: {
      type: "string"
    },
    status: {
      type: "string"
    },
    warningCount: {
      type: "number"
    }
  },
  required: ["id", "name", "status", "warningCount"]
} as const;

export const datasetDetailSchema = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    name: {
      type: "string"
    },
    status: {
      type: "string"
    },
    warnings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: {
            type: "string"
          },
          message: {
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
  properties: {
    bucket: {
      type: "string"
    },
    objectKey: {
      type: "string"
    }
  },
  required: ["bucket", "objectKey"]
} as const;

export const createUploadResponseSchema = {
  type: "object",
  properties: {
    upload: uploadSessionSchema,
    dataset: datasetSummarySchema
  },
  required: ["upload", "dataset"]
} as const;

export const workbookSchema = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    tenantId: {
      type: "string"
    },
    name: {
      type: "string"
    }
  },
  required: ["id", "tenantId", "name"]
} as const;

export const dashboardSchema = {
  type: "object",
  properties: {
    id: {
      type: "string"
    },
    tenantId: {
      type: "string"
    },
    name: {
      type: "string"
    },
    workbookId: {
      type: ["string", "null"]
    }
  },
  required: ["id", "tenantId", "name", "workbookId"]
} as const;

export const selectedDashboardSchema = {
  type: "object",
  properties: {
    dashboardId: {
      type: ["string", "null"]
    }
  },
  required: ["dashboardId"]
} as const;
