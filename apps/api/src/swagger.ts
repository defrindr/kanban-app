import swaggerUi from 'swagger-ui-express';

const CARD_RESPONSE = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    listId: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string', nullable: true },
    position: { type: 'number' },
    labels: { type: 'array', items: { type: 'string' } },
    assignees: { type: 'array', items: { type: 'string' } },
    dueDate: { type: 'string', format: 'date-time', nullable: true },
    coverColor: { type: 'string', nullable: true },
    archived: { type: 'boolean' },
    checklist: { type: 'object', nullable: true },
    attachments: { type: 'object', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    comments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          content: { type: 'string' },
          userId: { type: 'string' },
          cardId: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              avatar: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    cardLabels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cardId: { type: 'string' },
          name: { type: 'string' },
          color: { type: 'string' },
        },
      },
    },
    cardAssignees: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          cardId: { type: 'string' },
          userId: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              avatar: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  },
};

const BOARD_RESPONSE = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    description: { type: 'string', nullable: true },
    ownerId: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    members: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          boardId: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'VIEWER'] },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              avatar: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    lists: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          boardId: { type: 'string' },
          title: { type: 'string' },
          position: { type: 'number' },
          _count: {
            type: 'object',
            properties: {
              cards: { type: 'integer' },
            },
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
};

const COMMENT_RESPONSE = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    cardId: { type: 'string' },
    userId: { type: 'string' },
    content: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        name: { type: 'string' },
        avatar: { type: 'string', nullable: true },
      },
    },
  },
};

const ERROR_RESPONSE = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
      },
    },
  },
};

const OK_RESPONSE = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', enum: [true] },
    data: { type: 'object' },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
      },
    },
  },
};

const bearerAuth = { bearerAuth: [] };

export const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Kanban Board API',
    version: '1.0.0',
    description: 'Production-grade kanban board REST API with auth, RBAC, boards, lists, cards, comments, labels, and attachments.',
  },
  servers: [
    { url: 'http://localhost:4000/api/v1', description: 'Local development (v1)' },
    { url: 'http://localhost:4000/api', description: 'Local development (legacy — deprecated)' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          ok: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      Board: BOARD_RESPONSE,
      Card: CARD_RESPONSE,
      Comment: COMMENT_RESPONSE,
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  name: { type: 'string', example: 'John Doe' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', enum: [true] },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', description: 'JWT access token (expires 7d)' },
                        refreshToken: { type: 'string', description: 'Refresh token (expires 30d, one-time use)' },
                         user: {
                           type: 'object',
                           properties: {
                             id: { type: 'string' },
                             email: { type: 'string' },
                             name: { type: 'string' },
                             avatar: { type: 'string', nullable: true },
                             role: { type: 'string', enum: ['USER', 'ADMIN'] },
                           },
                         },
                       },
                     },
                   },
                 },
               },
             },
           },
           '409': { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
           '422': { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
         },
       },
     },
     '/api/auth/login': {
       post: {
         tags: ['Auth'],
         summary: 'Login with email and password',
         requestBody: {
           required: true,
           content: {
             'application/json': {
               schema: {
                 type: 'object',
                 required: ['email', 'password'],
                 properties: {
                   email: { type: 'string', format: 'email', example: 'user@example.com' },
                   password: { type: 'string', example: 'password123' },
                 },
               },
             },
           },
         },
         responses: {
           '200': {
             description: 'Login successful',
             content: {
               'application/json': {
                 schema: {
                   type: 'object',
                   properties: {
                     ok: { type: 'boolean', enum: [true] },
                     data: {
                       type: 'object',
                       properties: {
                         token: { type: 'string', description: 'JWT access token (expires 7d)' },
                         refreshToken: { type: 'string', description: 'Refresh token (expires 30d, one-time use)' },
                         user: {
                           type: 'object',
                           properties: {
                             id: { type: 'string' },
                             email: { type: 'string' },
                             name: { type: 'string' },
                             avatar: { type: 'string', nullable: true },
                             role: { type: 'string', enum: ['USER', 'ADMIN'] },
                           },
                         },
                       },
                     },
                   },
                 },
               },
             },
           },
          '401': { description: 'Invalid email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user',
        security: [bearerAuth],
        responses: {
          '200': {
            description: 'Current user info',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', enum: [true] },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        avatar: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Not authenticated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token using a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Refresh token from register/login' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'New access and refresh tokens (old refresh token is revoked)',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: { type: 'object', properties: { token: { type: 'string' }, refreshToken: { type: 'string' }, user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, avatar: { type: 'string', nullable: true } } } } } } } } },
          },
          '401': { description: 'Invalid or expired refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string', description: 'Refresh token to revoke' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token revoked' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/api/boards': {
      get: {
        tags: ['Boards'],
        summary: 'List all boards for the current user',
        security: [bearerAuth],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search boards by name (case-insensitive)' },
        ],
        responses: {
          '200': {
            description: 'Paginated list of boards',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean', enum: [true] },
                    data: { type: 'array', items: BOARD_RESPONSE },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Boards'],
        summary: 'Create a new board',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 100, example: 'My Board' },
                  description: { type: 'string', maxLength: 500, example: 'A sample board' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Board created with 3 default lists and creator as ADMIN member', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: BOARD_RESPONSE } } } } },
        },
      },
    },
    '/api/boards/{id}': {
      get: {
        tags: ['Boards'],
        summary: 'Get a single board by ID',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Board details with lists, cards, and members', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: BOARD_RESPONSE } } } } },
          '404': { description: 'Board not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Boards'],
        summary: 'Update a board',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string', maxLength: 500 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Board updated' },
          '404': { description: 'Board not found' },
        },
      },
      delete: {
        tags: ['Boards'],
        summary: 'Delete a board (owner only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Board deleted' },
          '403': { description: 'Only the owner can delete' },
          '404': { description: 'Board not found' },
        },
      },
    },
    '/api/boards/{id}/activities': {
      get: {
        tags: ['Boards'],
        summary: 'Get activity log for a board with pagination and filters',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'action', in: 'query', schema: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'MOVE'] }, description: 'Filter by action type' },
          { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['BOARD', 'LIST', 'CARD', 'COMMENT'] }, description: 'Filter by entity type' },
          { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Filter by user ID' },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter activities after this date' },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter activities before this date' },
        ],
        responses: {
          '200': {
            description: 'Paginated filtered activities',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          boardId: { type: 'string' },
                          userId: { type: 'string' },
                          action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'MOVE'] },
                          entityType: { type: 'string', enum: ['BOARD', 'LIST', 'CARD', 'COMMENT'] },
                          entityId: { type: 'string' },
                          metadata: { type: 'object' },
                          createdAt: { type: 'string', format: 'date-time' },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              avatar: { type: 'string', nullable: true },
                            },
                          },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '422': { description: 'Invalid filter parameters' },
        },
      },
    },
    '/api/boards/search': {
      get: {
        tags: ['Boards'],
        summary: 'Global search across all accessible boards, cards, lists, and comments',
        security: [bearerAuth],
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 1, maxLength: 200 }, description: 'Search query' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['all', 'boards', 'cards', 'lists', 'comments'], default: 'all' }, description: 'Entity type to search' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 } },
        ],
        responses: {
          '200': {
            description: 'Search results grouped by entity type',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        boards: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, description: { type: 'string' } } } },
                        cards: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, title: { type: 'string' }, boardId: { type: 'string' }, boardName: { type: 'string' } } } },
                        lists: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, boardId: { type: 'string' } } } },
                        comments: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, content: { type: 'string' }, cardId: { type: 'string' } } } },
                      },
                    },
                    meta: { type: 'object', properties: { q: { type: 'string' }, type: { type: 'string' }, page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/boards/{boardId}/members': {
      get: {
        tags: ['Board Members'],
        summary: 'List all members of a board',
        security: [bearerAuth],
        parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'List of board members',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          boardId: { type: 'string' },
                          userId: { type: 'string' },
                          role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'VIEWER'] },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              name: { type: 'string' },
                              avatar: { type: 'string', nullable: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Not a member of this board' },
          '404': { description: 'Board not found' },
        },
      },
      post: {
        tags: ['Board Members'],
        summary: 'Add a member to the board (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', description: 'User ID to add' },
                  role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'VIEWER'], default: 'MEMBER' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Member added' },
          '403': { description: 'Only admins can add members' },
          '404': { description: 'User not found' },
          '409': { description: 'User is already a member' },
        },
      },
    },
    '/api/boards/{boardId}/members/{memberId}': {
      put: {
        tags: ['Board Members'],
        summary: 'Update member role (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['ADMIN', 'MEMBER', 'VIEWER'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated' },
          '403': { description: 'Only admins can change roles' },
          '404': { description: 'Member not found' },
        },
      },
      delete: {
        tags: ['Board Members'],
        summary: 'Remove a member (admin or self)',
        security: [bearerAuth],
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'memberId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Member removed' },
          '403': { description: 'Only admins can remove others, cannot remove last admin' },
          '404': { description: 'Member not found' },
        },
      },
    },
    '/api/boards/{boardId}/webhooks': {
      get: {
        tags: ['Webhooks'],
        summary: 'List all webhooks for a board (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'List of webhooks',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          url: { type: 'string' },
                          events: { type: 'array', items: { type: 'string' } },
                          active: { type: 'boolean' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Only board admins can manage webhooks' },
        },
      },
      post: {
        tags: ['Webhooks'],
        summary: 'Create a webhook for a board (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'boardId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['url', 'events'],
                properties: {
                  url: { type: 'string', format: 'uri', description: 'Webhook callback URL (max 500 chars)' },
                  events: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of event types to subscribe to',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Webhook created (secret returned only on creation)' },
          '403': { description: 'Only board admins can manage webhooks' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/api/boards/{boardId}/webhooks/{webhookId}': {
      put: {
        tags: ['Webhooks'],
        summary: 'Update a webhook (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'webhookId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  url: { type: 'string', format: 'uri' },
                  events: { type: 'array', items: { type: 'string' } },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook updated' },
          '403': { description: 'Only board admins can manage webhooks' },
          '404': { description: 'Webhook not found' },
        },
      },
      delete: {
        tags: ['Webhooks'],
        summary: 'Delete a webhook (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'boardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'webhookId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Webhook deleted' },
          '403': { description: 'Only board admins can manage webhooks' },
          '404': { description: 'Webhook not found' },
        },
      },
    },
    '/api/lists': {
      post: {
        tags: ['Lists'],
        summary: 'Create a new list in a board',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['boardId', 'title'],
                properties: {
                  boardId: { type: 'string' },
                  title: { type: 'string', maxLength: 100, example: 'In Progress' },
                  position: { type: 'number', default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'List created' },
        },
      },
    },
    '/api/lists/{id}': {
      put: {
        tags: ['Lists'],
        summary: 'Update a list',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', maxLength: 100 },
                  position: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'List updated' },
          '404': { description: 'List not found' },
        },
      },
      delete: {
        tags: ['Lists'],
        summary: 'Delete a list',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'List deleted' },
          '404': { description: 'List not found' },
        },
      },
    },
    '/api/lists/{id}/cards': {
      get: {
        tags: ['Lists'],
        summary: 'Get paginated cards for a list',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated cards for the list',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: { type: 'array', items: CARD_RESPONSE },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'List not found' },
        },
      },
    },
    '/api/cards/search': {
      get: {
        tags: ['Cards'],
        summary: 'Search and filter cards within a board',
        security: [bearerAuth],
        parameters: [
          { name: 'boardId', in: 'query', required: true, schema: { type: 'string' }, description: 'Board ID to search within' },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search text in title and description (case-insensitive)' },
          { name: 'listId', in: 'query', schema: { type: 'string' }, description: 'Filter by list ID' },
          { name: 'labels', in: 'query', schema: { type: 'string' }, description: 'Comma-separated label names to filter by' },
          { name: 'assigneeId', in: 'query', schema: { type: 'string' }, description: 'Filter by assignee user ID' },
          { name: 'archived', in: 'query', schema: { type: 'boolean' }, description: 'Filter by archived status' },
          { name: 'dueBefore', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter cards with dueDate before this date' },
          { name: 'dueAfter', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Filter cards with dueDate after this date' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated filtered cards',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: { type: 'array', items: CARD_RESPONSE },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/cards': {
      post: {
        tags: ['Cards'],
        summary: 'Create a new card in a list',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listId', 'title'],
                properties: {
                  listId: { type: 'string' },
                  title: { type: 'string', maxLength: 200, example: 'Implement login' },
                  description: { type: 'string', maxLength: 2000 },
                  position: { type: 'number', default: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Card created', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: CARD_RESPONSE } } } } },
          '404': { description: 'List not found' },
        },
      },
    },
    '/api/cards/{id}': {
      put: {
        tags: ['Cards'],
        summary: 'Update a card',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', maxLength: 200 },
                  description: { type: 'string', maxLength: 2000 },
                  position: { type: 'number' },
                  labels: { type: 'array', items: { type: 'string' } },
                  assignees: { type: 'array', items: { type: 'string' } },
                  dueDate: { type: 'string', format: 'date-time', nullable: true },
                  coverColor: { type: 'string', nullable: true },
                  archived: { type: 'boolean' },
                  checklist: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, text: { type: 'string' }, done: { type: 'boolean' } } } },
                  attachments: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' }, url: { type: 'string' }, type: { type: 'string' }, size: { type: 'number' }, createdAt: { type: 'string' } } } },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Card updated' },
          '404': { description: 'Card not found' },
        },
      },
      delete: {
        tags: ['Cards'],
        summary: 'Delete a card',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Card deleted' },
          '404': { description: 'Card not found' },
        },
      },
    },
    '/api/cards/move': {
      post: {
        tags: ['Cards'],
        summary: 'Move a card to a different list and position',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['cardId', 'toListId', 'newPosition'],
                properties: {
                  cardId: { type: 'string' },
                  toListId: { type: 'string' },
                  newPosition: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Card moved' },
          '404': { description: 'Card not found' },
        },
      },
    },
    '/api/cards/{id}/labels': {
      post: {
        tags: ['Card Labels'],
        summary: 'Add a label to a card',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  name: { type: 'string', maxLength: 50, example: 'Bug' },
                  color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$', default: '#3B82F6' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Label added' },
          '404': { description: 'Card not found' },
        },
      },
    },
    '/api/cards/{id}/labels/{labelId}': {
      delete: {
        tags: ['Card Labels'],
        summary: 'Remove a label from a card',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'labelId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Label removed' },
          '404': { description: 'Label not found' },
        },
      },
    },
    '/api/cards/{id}/assignees': {
      post: {
        tags: ['Card Assignees'],
        summary: 'Assign a user to a card',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['userId'],
                properties: {
                  userId: { type: 'string', description: 'User ID to assign' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User assigned' },
          '404': { description: 'Card not found' },
        },
      },
    },
    '/api/cards/{id}/assignees/{assigneeId}': {
      delete: {
        tags: ['Card Assignees'],
        summary: 'Remove an assignee from a card',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'assigneeId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Assignee removed' },
          '404': { description: 'Assignee not found' },
        },
      },
    },
    '/api/cards/{id}/comments': {
      post: {
        tags: ['Comments'],
        summary: 'Add a comment to a card (via card endpoint)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 2000, example: 'Great work!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Comment created' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/api/cards/{id}/attachments': {
      post: {
        tags: ['Card Attachments'],
        summary: 'Upload a file attachment to a card',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'File to upload (max 10MB, allowed: images, PDF, DOC, TXT, CSV, ZIP, GZIP)' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Attachment uploaded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        url: { type: 'string' },
                        type: { type: 'string' },
                        size: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '404': { description: 'Card not found' },
          '422': { description: 'Invalid file type or missing file' },
        },
      },
    },
    '/api/cards/{id}/attachments/{attachmentId}': {
      delete: {
        tags: ['Card Attachments'],
        summary: 'Delete an attachment from a card',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Attachment deleted' },
          '404': { description: 'Card or attachment not found' },
        },
      },
    },
    '/api/comments/card/{cardId}': {
      get: {
        tags: ['Comments'],
        summary: 'List comments for a card (paginated)',
        security: [bearerAuth],
        parameters: [
          { name: 'cardId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Paginated comments', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: { type: 'array', items: COMMENT_RESPONSE }, meta: { type: 'object', properties: { page: { type: 'integer' }, limit: { type: 'integer' }, total: { type: 'integer' } } } } } } } },
          '404': { description: 'Card not found' },
        },
      },
      post: {
        tags: ['Comments'],
        summary: 'Create a comment on a card',
        security: [bearerAuth],
        parameters: [{ name: 'cardId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Comment created with activity logging', content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' }, data: COMMENT_RESPONSE } } } } },
          '404': { description: 'Card not found' },
        },
      },
    },
    '/api/admin/activities': {
      get: {
        tags: ['Admin'],
        summary: 'Get global audit log across all boards (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'boardId', in: 'query', schema: { type: 'string' }, description: 'Filter by board ID' },
          { name: 'action', in: 'query', schema: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'MOVE'] } },
          { name: 'entityType', in: 'query', schema: { type: 'string', enum: ['BOARD', 'LIST', 'CARD', 'COMMENT'] } },
          { name: 'userId', in: 'query', schema: { type: 'string' }, description: 'Filter by user ID' },
          { name: 'dateFrom', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dateTo', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: {
          '200': {
            description: 'Paginated filtered global audit log',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          boardId: { type: 'string' },
                          userId: { type: 'string' },
                          action: { type: 'string', enum: ['CREATE', 'UPDATE', 'DELETE', 'MOVE'] },
                          entityType: { type: 'string', enum: ['BOARD', 'LIST', 'CARD', 'COMMENT'] },
                          entityId: { type: 'string' },
                          metadata: { type: 'object' },
                          createdAt: { type: 'string', format: 'date-time' },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              avatar: { type: 'string', nullable: true },
                            },
                          },
                        },
                      },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        total: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get system statistics (admin only)',
        security: [bearerAuth],
        responses: {
          '200': {
            description: 'System stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        users: { type: 'integer' },
                        boards: { type: 'integer' },
                        lists: { type: 'integer' },
                        cards: { type: 'integer' },
                        comments: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of users',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        users: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              email: { type: 'string' },
                              name: { type: 'string' },
                              avatar: { type: 'string', nullable: true },
                              role: { type: 'string', enum: ['USER', 'ADMIN'] },
                              createdAt: { type: 'string', format: 'date-time' },
                            },
                          },
                        },
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/admin/users/{id}': {
      get: {
        tags: ['Admin'],
        summary: 'Get user by ID (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': {
            description: 'User details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        avatar: { type: 'string', nullable: true },
                        role: { type: 'string', enum: ['USER', 'ADMIN'] },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Admin access required' },
          '404': { description: 'User not found' },
        },
      },
      put: {
        tags: ['Admin'],
        summary: 'Update user role (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['USER', 'ADMIN'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'User role updated' },
          '403': { description: 'Admin access required' },
          '404': { description: 'User not found' },
          '422': { description: 'Cannot change own role or invalid role' },
        },
      },
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user (admin only, cannot delete self)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User deleted' },
          '403': { description: 'Admin access required' },
          '422': { description: 'Cannot delete yourself' },
        },
      },
    },
    '/api/admin/boards': {
      get: {
        tags: ['Admin'],
        summary: 'List all boards (admin only)',
        security: [bearerAuth],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Paginated list of all boards',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        boards: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              name: { type: 'string' },
                              description: { type: 'string', nullable: true },
                              ownerId: { type: 'string' },
                              createdAt: { type: 'string', format: 'date-time' },
                              updatedAt: { type: 'string', format: 'date-time' },
                              _count: {
                                type: 'object',
                                properties: {
                                  lists: { type: 'integer' },
                                  members: { type: 'integer' },
                                },
                              },
                            },
                          },
                        },
                        total: { type: 'integer' },
                        page: { type: 'integer' },
                        limit: { type: 'integer' },
                        totalPages: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/admin/boards/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete any board (admin only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Board deleted' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/api/comments/{id}': {
      put: {
        tags: ['Comments'],
        summary: 'Update a comment (owner only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Comment updated' },
          '403': { description: 'You can only edit your own comments' },
          '404': { description: 'Comment not found' },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Delete a comment (owner only)',
        security: [bearerAuth],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Comment deleted' },
          '403': { description: 'You can only delete your own comments' },
          '404': { description: 'Comment not found' },
        },
      },
    },
  },
};

export const swaggerServe = swaggerUi.serve;
export const swaggerSetup = swaggerUi.setup(spec);
