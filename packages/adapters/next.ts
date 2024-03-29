import { TRPCError } from "@trpc/server"
import { NextApiRequest, NextApiResponse } from "next"

// Application Sectional || Define Imports
// =================================================================================================
// =================================================================================================
import { normalizePath } from "../utils/path"
import { OpenApiErrorResponse, OpenApiRouter } from "../types"
import { CreateOpenApiNodeHttpHandlerOptions, createOpenApiNodeHttpHandler } from "./node-http/core"

// Application Sectional || Define Export Type
// =================================================================================================
// =================================================================================================
export type CreateOpenApiNextHandlerOptions<TRouter extends OpenApiRouter> = Omit<
  // @ts-ignore - Expected Error: 'MockResponse<Response<any, Record<string, any>>>' is not assignable to parameter of type 'NodeHTTPResponse'.
  CreateOpenApiNodeHttpHandlerOptions<TRouter, NextApiRequest, NextApiResponse>,
  "maxBodySize"
>;

// Application Sectional || Define Export Handler
// =================================================================================================
// =================================================================================================
export const createOpenApiNextHandler = <TRouter extends OpenApiRouter>(
  opts: CreateOpenApiNextHandlerOptions<TRouter>
) => {
  const openApiHttpHandler = createOpenApiNodeHttpHandler(opts)

  return async (req: NextApiRequest, res: NextApiResponse) => {
    let pathname: string | null = null
    if (typeof req.query.trpc === "string") {
      pathname = req.query.trpc
    } else if (Array.isArray(req.query.trpc)) {
      pathname = req.query.trpc.join("/")
    }

    if (pathname === null) {
      const error = new TRPCError({
        message: "Query \"trpc\" not found - is the `trpc-swagger` file named `[...trpc].ts`?",
        code: "INTERNAL_SERVER_ERROR"
      })

      opts.onError?.({
        error,
        type: "unknown",
        path: undefined,
        input: undefined,
        ctx: undefined,
        req
      })

      res.statusCode = 500
      res.setHeader("Content-Type", "application/json")
      const body: OpenApiErrorResponse = {
        message: error.message,
        code: error.code
      }
      res.end(JSON.stringify(body))

      return
    }

    req.url = normalizePath(pathname)
    await openApiHttpHandler(req, res)
  }
}
