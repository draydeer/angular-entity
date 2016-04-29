

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
                            params, data, options
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

                        options: function (
                            params, data, options
                        ) {
                            return $http.options(this.compileQuery(params), data, options);
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
                        },

                        trace: function (
                            params, data, options
                        ) {
                            return $http.trace(this.compileQuery(params), data, options);
                        }

                    };

                    function Resty(
                        base, routes
                    )
                    {
                        this.base = base;
                        this.deferred = [];
                        this.errorHandler = null;
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
                                                throw new Error('Route is not defined: ' + k);
                                            }

                                            method = v[1] || 'get';
                                            route = this.base + '/' + v[0];
                                        } else {
                                            method = v.method || 'get';

                                            if (v.route === void 0) {
                                                throw new Error('Route is not defined: ' + k);
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
                                        throw new Error('Http method is not defined: ' + method);
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

    var $entityMinErr = angular.$$minErr('$entity');

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

                    /**
                     * Constructor.
                     *
                     * @param alias Entity alias.
                     * @param scope $scope reference.
                     * @param mappedProperty Mapped property of $scope or custom handler:
                     *      $scope = {
                     *          mappedProperty: []
                     *      }
                     *
                     *      Custom handler:
                     *      (entity reference, key) => {} - as getter
                     *      (entity reference, key, value) => {} - as setter
                     *
                     * @param transport I/O transport.
                     * @param methods Custom model methods.
                     * @constructor
                     */
                    function EntityCollection(
                        alias, scope, mappedProperty, transport, methods
                    )
                    {
                        if (angular.isString(alias) === false) {
                            throw new Error('Incorrect [alias].');
                        }

                        if (angular.isString(mappedProperty) === false && angular.isFunction(mappedProperty) === false) {
                            throw new Error('Incorrect [mappedProperty].');
                        }

                        if (angular.isObject(transport) === false) {
                            throw new Error('Incorrect [transport].');
                        }

                        this.alias = alias;
                        this.allMethod = 'getAll';
                        this.delMethod = 'delete';
                        this.defaults = void 0;
                        this.k = null;
                        this.mappedProperty = mappedProperty;
                        this.methods = methods && {};
                        this.oneMapper = null;
                        this.oneMethod = 'getOne';
                        this.putMethods = ['create', 'update'];
                        this.relations = {};
                        this.scope = scope;
                        this.transport = transport;
                        this.transportOptions = {};

                        if (transport.routes) {
                            forEach(transport.routes, function (v, k) {
                                if (angular.isFunction(mappedProperty)) {
                                    this[k] = function () {
                                        return v.call(transport, this.mappedProperty(this.scope, this.k), this.mappedProperty(this.scope, this.k));
                                    }.bind(this);
                                } else {
                                    this[k] = function () {
                                        return v.call(transport, this.get(this.k), this.get(this.k));
                                    }.bind(this);
                                }
                            }.bind(this));
                        }

                        if (methods) {
                            forEach(methods, function (v, k) {
                                if (angular.isString(v)) {
                                    this.methods[k] = this[v];
                                } else {
                                    this.methods[k] = v;
                                }
                            }.bind(this));
                        }
                    }

                    EntityCollection.RELATION_ONE_TO_ONE = 0;
                    EntityCollection.RELATION_ONE_TO_MANY = 1;

                    function _entityMarkAsNotNew(entity, k) {
                        forEach(k === void 0 ? entity.get() : [entity.get(k)], function (v) {
                            v.$$new = false;
                        });

                        return entity;
                    }

                    EntityCollection.prototype = {

                        /**
                         * Set [getAll] transport method alias.
                         *
                         * @param value
                         * @returns {EntityCollection}
                         */
                        setAll: function (
                            value
                        ) {
                            this.allMethod = value;

                            return this;
                        },

                        /**
                         * Set default values for new model entry.
                         *
                         * @param value
                         * @returns {EntityCollection}
                         */
                        setDefaults: function (
                            value
                        ) {
                            this.defaults = value;

                            return this;
                        },

                        /**
                         * Set [delete] transport method alias.
                         *
                         * @param value
                         * @returns {EntityCollection}
                         */
                        setDel: function (
                            value
                        ) {
                            this.delMethod = value;

                            return this;
                        },

                        /**
                         * Set [getOne] transport method alias.
                         *
                         * @param value
                         * @returns {EntityCollection}
                         */
                        setOne: function (
                            value
                        ) {
                            this.oneMethod = value;

                            return this;
                        },

                        /**
                         * Set [create] and [update] transport methods aliases.
                         *
                         * @param create
                         * @param update
                         * @returns {EntityCollection}
                         */
                        setPut: function (
                            create, update
                        ) {
                            this.putMethods = [create, update];

                            return this;
                        },

                        setOneMapper: function (
                            value
                        ) {
                            this.oneMapper = value;

                            return this;
                        },

                        setOneToOne: function(
                            alias, entity, l, r
                        ) {
                            this.relations[alias] = [entity.setOneToOne(this.alias, EntityCollection.RELATION_ONE_TO_ONE), EntityCollection.RELATION_ONE_TO_ONE, l, r];

                            return this;
                        },

                        setOneToMany: function(
                            alias, entity, l, r
                        ) {
                            this.relations[alias] = [entity.setOneToOne(this.alias, EntityCollection.RELATION_ONE_TO_ONE), EntityCollection.RELATION_ONE_TO_MANY, l, r];

                            return this;
                        },

                        setTransport: function (
                            value
                        ) {
                            this.transport = value;

                            return this;
                        },

                        setTransportOptions: function (
                            value
                        ) {
                            this.transportOptions = angular.isPrototypeOf(value) ? value : {};

                            return this;
                        },

                        get: function (
                            k, defaultValue
                        ) {
                            k = k !== void 0 ? k.toString().split('.') : void 0;

                            var i, l, res;

                            if (angular.isFunction(this.mappedProperty)) {
                                res = this.mappedProperty(this, k && k[0]);
                            } else if (k === void 0) {
                                res = this.scope[this.mappedProperty];
                            } else if (k[0] in this.scope[this.mappedProperty]) {
                                res = this.scope[this.mappedProperty];
                            } else {
                                throw new Error('Key is not defined: ' + (k && k[0]));
                            }

                            if (k === void 0) {
                                return res;
                            }

                            for (i = 0, l = k.length; i < l; i ++) {
                                if (k[i] in res) {
                                    res = res[k[i]];
                                } else {
                                    return defaultValue;
                                }
                            }

                            return res;
                        },

                        set: function (
                            k, value
                        ) {
                            if (value === void 0) {
                                return angular.isFunction(this.mappedProperty) ? this.mappedProperty(this, void 0, k) : this.scope[this.mappedProperty] = k;
                            }

                            k = k.toString().split('.');

                            var i, l, res;

                            if (angular.isFunction(this.mappedProperty)) {
                                res = this.mappedProperty(this, k && k[0], value);
                            } else if (k[0] in this.scope[this.mappedProperty]) {
                                res = this.scope[this.mappedProperty];
                            } else {
                                res = (angular.isArray(this.scope[this.mappedProperty]) ? k[0] = this.scope[this.mappedProperty].push({}) - 1 : (this.scope[this.mappedProperty][k[0]] = {})) && this.scope[this.mappedProperty];
                            }

                            for (i = 0, l = k.length - 1; i < l; i ++) {
                                res = (k[i] in res && angular.isObject(res[k[i]])) ? res[k[i]] : (res[k[i]] = {});
                            }

                            if (angular.isArray(res) && k[i] >= res.length) {
                                return res.push(value);
                            }

                            res[k[i]] = value;

                            return k[i];
                        },

                        getRelated: function (
                            alias, query
                        ) {
                            if (alias in this.relations) {

                            }

                            throw new Error('Relation is not defined: ' + alias);
                        },

                        all: function (
                            query
                        ) {
                            return $q(function (resolve, reject) {
                                if (angular.isFunction(this.transport[this.allMethod]) === false) {
                                    throw new Error('[getAll] transport method required.');
                                }

                                this.transport.responseSimpleOnce = true;

                                this.transport[this.allMethod](query).then(
                                    function (res) {
                                        angular.isFunction(this.mappedProperty)
                                            ? this.mappedProperty(this.scope, res, true)
                                            : this.scope[this.mappedProperty] = res;

                                        _entityMarkAsNotNew(this);

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        clear: function (

                        ) {
                            angular.isString(this.mappedProperty) ? this.scope[this.mappedProperty] = {} : this.mappedProperty(this.scope, void 0, []);

                            return this;
                        },

                        collection: function (

                        ) {
                            return this;
                        },

                        del: function (
                            k
                        ) {
                            if (angular.isFunction(this.transport[this.delMethod]) === false) {
                                throw new Error('[delete] transport method required.');
                            }

                            return $q(function (resolve, reject) {
                                this.transport[this.delMethod](this.get(k), this.get(k)).then(
                                    function (res) {
                                        if (angular.isArray(this.scope[this.mappedProperty])) {
                                            this.scope[this.mappedProperty].splice(k, 1);
                                        } else {
                                            delete this.scope[this.mappedProperty][k];
                                        }

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        on: function (
                            k, defaults
                        ) {
                            if (k in this.scope[this.mappedProperty]) {
                                this.k = k;
                            } else {
                                defaults = defaults ? extend(defaults, this.defaults) : this.defaults;

                                if (defaults !== void 0) {
                                    this.k = this.set(k, defaults);
                                } else {
                                    throw new Error('Key is not defined: ' + k);
                                }
                            }

                            return factoryEntityModel(this, this.k);
                        },

                        one: function (
                            query, asProperty
                        ) {
                            return $q(function (resolve, reject) {
                                if (angular.isFunction(this.transport[this.oneMethod]) === false) {
                                    throw new Error('[getOne] transport method required.');
                                }

                                this.transport.responseSimpleOnce = true;

                                this.transport[this.oneMethod](query).then(
                                    function (res) {
                                        var k = angular.isFunction(this.mappedProperty)
                                            ? this.mappedProperty(this.scope, asProperty || true, res)
                                            : this.set(asProperty || res[this.oneMapper], res);

                                        _entityMarkAsNotNew(this, k);

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        put: function (
                            k
                        ) {
                            if (angular.isFunction(this.transport[this.putMethods[0]]) === false || angular.isFunction(this.transport[this.putMethods[1]]) === false) {
                                throw new Error('[create] or [update] transport method required.');
                            }

                            var promises = [];

                            forEach(k !== void 0 ? [this.get(k)] : this.get(), function (v) {
                                promises.push($q(function (resolve, reject) {

                                    // store $$new state of model temporary
                                    var $$new = v.$$new;

                                    delete v.$$new;

                                    // [update] or [create] routes
                                    this.transport[this.putMethods[$$new !== false ? 0 : 1]](v, v).then(
                                        function (res) {
                                            v.$$new = false;

                                            resolve(res);
                                        },
                                        function (err) {
                                            v.$$new = $$new;

                                            reject(err);
                                        }
                                    );
                                }.bind(this)));
                            }.bind(this));

                            return $q.all(promises);
                        }

                    };

                    function EntityModel(
                        context, key
                    )
                    {
                        this.get = function (
                            k, defaultValue
                        ) {
                            return context.get(key + '.' + k, defaultValue);
                        };

                        this.set = function (
                            k, v
                        ) {
                            return context.set(key + '.' + k, v) ? this : this;
                        };

                        this.collection = function (

                        ) {
                            return context;
                        };

                        this.del = function (

                        ) {
                            return $q(function (resolve, reject) {
                                context.del(key).then(
                                    function (res) {
                                        context = null;

                                        resolve(res);
                                    },
                                    reject
                                )
                            });
                        };

                        this.put = function (

                        ) {
                            return context.put(key);
                        };

                        if (context.methods) {
                            for (var k in context.methods) {
                                this[k] = context.methods[k];
                            }
                        }
                    }

                    EntityModel.setPrototype = function (proto) {
                        EntityModel.prototype = proto;

                        return EntityModel;
                    };

                    function factory(
                        alias, scope, mappedProperty, transport, methods
                    )
                    {
                        return new EntityCollection(alias, scope, mappedProperty, transport, methods);
                    }

                    function factoryEntityModel(
                        context, key
                    )
                    {
                        return new (EntityModel.setPrototype(context.get(key)))(context, key);
                    }

                    return factory;
                }
            ]
        );

})(window, window.angular);
