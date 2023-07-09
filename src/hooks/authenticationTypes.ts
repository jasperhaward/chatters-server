import {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  RawServerBase,
  RawServerDefault,
  RawRequestDefaultExpression,
  RawReplyDefaultExpression,
  FastifyTypeProvider,
  FastifyTypeProviderDefault,
  RouteGenericInterface,
  ContextConfigDefault,
  FastifySchema,
  FastifyBaseLogger,
} from "fastify";

import { TokenPayload } from "../services";
import authentication from "./authenticationHook";

// prettier-ignore
export type AuthedRouteHandlerMethod<
  RawServer extends RawServerBase = RawServerDefault,
  RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
  RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
  RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
  ContextConfig = ContextConfigDefault,
  SchemaCompiler extends FastifySchema = FastifySchema,
  TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault,
  Logger extends FastifyBaseLogger = FastifyBaseLogger
> = (
  this: FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>,
  request: FastifyRequest<RouteGeneric, RawServer, RawRequest, SchemaCompiler, TypeProvider, ContextConfig, Logger> & { token: TokenPayload }, 
  reply: FastifyReply<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider>
) => void | Promise<any>;

declare module "fastify" {
  interface FastifyRequest {
    token?: TokenPayload;
  }

  // prettier-ignore
  interface RouteShorthandMethod<
    RawServer extends RawServerBase = RawServerDefault,
    RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
    RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
    TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault
  > {
    <
      RouteGeneric extends RouteGenericInterface = RouteGenericInterface,
      ContextConfig = ContextConfigDefault,
      SchemaCompiler extends FastifySchema = FastifySchema,
      Logger extends FastifyBaseLogger = FastifyBaseLogger
    >(
      path: string,
      opts: RouteShorthandOptions<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig, SchemaCompiler, TypeProvider, Logger> & { onRequest: ReturnType<typeof authentication> }, 
      handler: AuthedRouteHandlerMethod<RawServer, RawRequest, RawReply, RouteGeneric, ContextConfig,  SchemaCompiler, TypeProvider, Logger> // 
    ): FastifyInstance<RawServer, RawRequest, RawReply, Logger, TypeProvider>;
  }
}
