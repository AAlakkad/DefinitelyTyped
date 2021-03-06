import Koa = require("koa");
import { Context } from "koa";
import compose = require("koa-compose");
import etag = require("koa-etag");
import Router = require("koa-router");

type MyState = {foo: string}
type MyContext = {bar: string}

const app = new Koa<{}, {}>();

const router = new Router<MyState, MyContext>({
    prefix: "/users"
});

router
    .param('id', function (id, ctx, next) {
        next();
    })
    .get('/', function (ctx, next) {
        ctx.body = 'Hello World!';
    })
    .get('user', '/users/:id', function (ctx, next) {
        ctx.body = {
          test1: ctx.router.url('user-accounts', { id: ctx.params.id }),
          test2: ctx.router.url('user-accounts', ctx.params.id),
          test3: ctx.router.url('user-accounts', [ctx.params.id]),
        }
    })
    .get('user-accounts', '/users/:id/accounts', function (ctx, next) {
        ctx.body = {
          test1: ctx.router.url('user', { id: 3 }, { query: { limit: 1 } }),
          test2: ctx.router.url('user', { id: 3 }, { query: "limit=1" }),
          test3: ctx.router.url('user', 3, { query: { limit: 1 } }),
          test4: ctx.router.url('user', [3], { query: "limit=1" }),
          test5: ctx.router.url('user', ["3"], { query: { limit: "1" } }),
        }
    })
    .post('/users', function (ctx, next) {
        ctx.state.foo = 'foo';
    })
    .put('/users/:id', function (ctx, next) {
        ctx.bar = 'bar';
        ctx.body = ctx.params.id;
    })
    .del('/users/:id', function () {
        // ...
    });

router.get('user', '/users/:id', function (ctx) {
    ctx.body = "sdsd";
});

const match = router.match('/users/:id', 'GET');

let layer: Router.Layer
let layerOptions: Router.ILayerOptions

const mw: Router.IMiddleware = (ctx: Koa.ParameterizedContext<any, Router.IRouterParamContext>, next: () => Promise<any>) => {
  ctx.body = "Ok";
};

const mw2: Router.IMiddleware = (ctx: Router.IRouterContext, next: () => Promise<any>) => {
  ctx.body = "Ok";
};

app.use(async (ctx: Koa.ParameterizedContext<MyState, MyContext>, next) => {
        ctx.state.foo = 'foo';
        await next();
    })
    .use(router.routes())
    .use(router.allowedMethods())
    .use(async (ctx, next) => {
        ctx.state.foo = '3';
        await next();
    })
    .listen(3000);

const router3 = new Router();
router3.get('/', (ctx) => {
    ctx.foo = "bar";
    console.log(ctx.router.params);
    ctx.body = "Hello World!";
});
router3.get('/foo', (ctx: Router.IRouterContext) => {
    ctx.body = "Yup";
})
new Koa()
    .use(async (ctx, next) => next())
    .use(router3.routes())
    .use(router.allowedMethods())
    .listen(3001);

// It's from https://github.com/DefinitelyTyped/DefinitelyTyped/pull/31704#issuecomment-451075919,
// to make sure we don't break it again

declare module "koa" {
    interface Context {
        name: string;
    }
}

const app2 = new Koa();

const conditional = async (ctx: Context, next: any) => {
    await next();
    if (ctx.fresh) {
        ctx.status = 304;
        ctx.body = null;
    }
};

const router2 = compose([conditional, etag()]);

app2.use(router2);

app2.use(async (ctx: Context, next: any) => {
    ctx.name = "hello world";
    await next();
});

app2.use((ctx: Context, next: any) => {
    console.log(ctx.name);
    ctx.body = ctx.name;
});

app2.listen(8000);
