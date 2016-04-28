

(function (window, angular) {

    'use strict';

    var $restyMinErr = angular.$$minErr('$resty');

    angular
        .module('ngResty', ['ng'])
        .factory(
            '$resty',
            [
                '$http',
                '$q',
                function ($http, $q) {
                    var noop = angular.noop,
                        forEach = angular.forEach,
                        extend = angular.extend,
                        copy = angular.copy;

                    function Route(
                        route, compileStrictly
                    )
                    {
                        this.compileStrictly = compileStrictly !== false;

                        var q = route.indexOf('?');

                        if (q !== - 1) {
                            this.path = route.substr(0, q);
                            this.q = route.substr(q + 1);
                        } else {
                            this.path = route;
                            this.q = null;
                        }
                    }

                    Route.prototype = {

                        compileQuery: function(
                            params
                        ) {
                            var path = this.path,
                                q = this.q;

                            if (params) {
                                if (path) {
                                    forEach(params, function (v, k) {
                                        path = path.replace(':' + k, v);
                                    });
                                }

                                if (q) {
                                    forEach(params, function (v, k) {
                                        q = q.replace(':' + k, encodeURIComponent(v));
                                    });
                                }
                            }

                            return q ? path + '?' + q : path;
                        },

                        delete: function (
                            params, data
                        ) {
                            return $http.delete(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        get: function (
                            params, data, options
                        ) {
                            return $http.get(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        head: function (
                            params, data, options
                        ) {
                            return $http.head(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        patch: function (
                            params, data, options
                        ) {
                            return $http.patch(this.compileQuery(params), data, options);
                        },

                        post: function (
                            params, data, options
                        ) {
                            return $http.post(this.compileQuery(params), data, options);
                        },

                        put: function (
                            params, data, options
                        ) {
                            return $http.put(this.compileQuery(params), data, options);
                        }

                    };

                    function Resty(
                        base, routes
                    )
                    {
                        this.base = base;
                        this.errorHandler = null;
                        this.queue = [];
                        this.queued = false;
                        this.rawResponse = true;
                        this.responseSimpleOnce = false;
                        this.routes = routes;
                        this.successHandler = null;

                        this.addRoutes(routes);
                    }

                    Resty.prototype = {

                        setErrorHandler: function (
                            value
                        ) {
                            this.errorHandler = angular.isFunction(value) ? value : null;

                            return this;
                        },

                        setQueued: function (
                            value
                        ) {
                            this.queued = value === true;

                            return this;
                        },

                        setRawResponse: function (
                            value
                        ) {
                            this.rawResponse = value === true;

                            return this;
                        },

                        setResponseSimpleOnce: function (
                            value
                        ) {
                            this.responseSimpleOnce = value === true;

                            return this;
                        },

                        setSuccessHandler: function (
                            value
                        ) {
                            this.successHandler = angular.isFunction(value) ? value : null;

                            return this;
                        },

                        addRoutes: function (
                            routes
                        ) {
                            if (angular.isObject(routes)) {
                                forEach(routes, function (v, k) {
                                    var errorHandler,
                                        method,
                                        route,
                                        successHandler;

                                    if (typeof v === 'string') {
                                        method = 'get';
                                        route = this.base + '/' + v;
                                    } else {
                                        if (angular.isArray(v)) {
                                            if (v.length === 0) {
                                                throw new Error('Route is undefined: ' + k);
                                            }

                                            method = v[1] || 'get';
                                            route = this.base + '/' + v[0];
                                        } else {
                                            method = v.method || 'get';

                                            if (v.route === void 0) {
                                                throw new Error('Route is undefined: ' + k);
                                            }

                                            route = this.base + '/' + v.route;

                                            errorHandler = angular.isFunction(v.errorHandler) ? v.errorHandler : null;
                                            successHandler = angular.isFunction(v.successHandler) ? v.successHandler : null;
                                        }
                                    }

                                    if (method in Route.prototype) {
                                        route = new Route(route);

                                        routes[k] = this[k] = function (
                                            params, data, options
                                        ) {
                                            return $q(function (resolve, reject) {
                                                route[method](params, data, options).then(
                                                    function (res) {
                                                        var handler = this.successHandler || successHandler;

                                                        if (handler) {
                                                            handler(res.data, res);
                                                        }

                                                        resolve((this.rawResponse && this.responseSimpleOnce === false) ? res : res.data);

                                                        this.responseSimpleOnce = false;
                                                    }.bind(this),
                                                    function (err) {
                                                        var handler = this.errorHandler || errorHandler;

                                                        if (handler) {
                                                            handler(err.data, err.status, err);
                                                        }

                                                        reject((this.rawResponse && this.responseSimpleOnce === false) ? err : err.status);

                                                        this.responseSimpleOnce = false;
                                                    }.bind(this)
                                                );
                                            }.bind(this));
                                        }
                                    } else {
                                        throw new Error('Http method is undefined: ' + method);
                                    }
                                }.bind(this));
                            }

                            return this;
                        }

                    };

                    function factory(
                        base, routes
                    )
                    {
                        return new Resty(base, routes);
                    }

                    return factory;
                }
            ]
        );

})(window, window.angular);

(function (window, angular) {

    'use strict';

    var $entity = angular.$$minErr('$entity');

    angular
        .module('ngEntity', ['ng', 'ngResty'])
        .factory(
            '$entity',
            [
                '$resty',
                '$q',
                function ($resty, $q) {
                    var noop = angular.noop,
                        forEach = angular.forEach,
                        extend = angular.extend,
                        copy = angular.copy;

                    function Entity(
                        scope, mapped, transport, methods
                    )
                    {
                        var argLength = [].reduce.call(arguments, function (a, v) { return a + (v !== void 0 ? 1 : 0); }, 0);

                        if (argLength < 2) {
                            throw new Error('Wrong number of arguments.');
                        }

                        if (argLength === 2) {
                            transport = mapped;
                            mapped = null;
                            methods = null;
                        }

                        if (argLength === 3) {
                            methods = transport;
                            transport = mapped;
                            mapped = null;
                        }

                        this.allSelector = 'getAll';
                        this.k = null;
                        this.mapped = mapped;
                        this.oneMapper = null;
                        this.oneSelector = 'getOne';
                        this.scope = scope;
                        this.transport = transport;

                        forEach(methods, function (v, k) {
                            this[k] = function () {

                            };
                        }.bind(this));

                        forEach(transport.routes || {}, function (v, k) {
                            if (angular.isFunction(mapped)) {
                                this[k] = function () {
                                    return v(this.mapped(this.scope, this.k), this.mapped(this.scope, this.k));
                                }.bind(this);
                            } else {
                                this[k] = function () {
                                    return v(this.scope[this.mapped][this.k], this.scope[this.mapped][this.k]);
                                }.bind(this);
                            }
                        }.bind(this));
                    }

                    function entityOneMapper(entity, res) {
                        if (angular.isFunction(entity.oneMapper)) {
                            return entity.oneMapper(entity.scope, res);
                        }

                        if (angular.isArray(entity.scope)) {
                            return entity.scope[entity.mapped].push(res);
                        }

                        if (angular.isString(entity.oneMapper)) {
                            return entity.scope[entity.mapped][res[entity.oneMapper]] = res;
                        }

                        return entity.scope = res;
                    }

                    Entity.prototype = {

                        setAll: function (
                            value
                        ) {
                            this.allSelector = value;

                            return this;
                        },

                        setOne: function (
                            value
                        ) {
                            this.oneSelector = value;

                            return this;
                        },

                        setOneMapper: function (
                            value
                        ) {
                            this.oneMapper = value;

                            return this;
                        },

                        setTransport: function (
                            value
                        ) {
                            this.transport = value;

                            return this;
                        },

                        all: function (
                            query
                        ) {
                            return $q(function (resolve, reject) {
                                if (angular.isFunction(this.transport[this.allSelector]) === false) {
                                    throw new Error('[getAll] transport method is undefined.');
                                }

                                this.transport.responseSimpleOnce = true;

                                this.transport[this.allSelector](query).then(
                                    function (res) {
                                        angular.isFunction(this.mapped)
                                            ? this.mapped(this.scope, res, true)
                                            : this.scope[this.mapped] = res;

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        clear: function (

                        ) {
                            angular.isString(this.mapped) && (this.scope[this.mapped] = {});

                            return this;
                        },

                        on: function (
                            k
                        ) {
                            this.k = k;

                            return this;
                        },

                        one: function (
                            query, asProperty
                        ) {
                            return $q(function (resolve, reject) {
                                if (angular.isFunction(this.transport[this.oneSelector]) === false) {
                                    throw new Error('[getOne] transport method is undefined.');
                                }

                                this.transport.responseSimpleOnce = true;

                                this.transport[this.oneSelector](query).then(
                                    function (res) {
                                        angular.isFunction(this.mapped)
                                            ? this.mapped(this.scope, res, asProperty || true)
                                            : (asProperty ? this.scope[this.mapped][asProperty] = res : this.scope = entityOneMapper(this, res));

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        }

                    };

                    function factory(
                        scope, mapped, transport, methods
                    )
                    {
                        return new Entity(scope, mapped, transport, methods);
                    }

                    return factory;
                }
            ]
        );

})(window, window.angular);
