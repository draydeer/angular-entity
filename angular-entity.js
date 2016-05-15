

(function (window, angular) {

    'use strict';

    var $restyMinErr = angular.$$minErr('$resty');

    angular
        .module('Resty', ['ng'])
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

                    function Route(route, compileStrictly, appendParams, defaults)
                    {
                        this.appendParams = appendParams === true;
                        this.compileStrictly = compileStrictly !== false;
                        this.defaults = defaults;
                        this.route = route;

                        var match,
                            re = /[^\\]:([\w\$]+)/g,
                            routeParams = [];

                        while (match = re.exec(route)) {
                            routeParams.push(match[1]);
                        }

                        this.routeParams = routeParams;

                        route = route.replace(/([^\\]):([\w\$]+)/g, "$1!@$#$2#$@!").replace('\:', ':');

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

                        compileQuery: function (params) {
                            var appendParams = this.appendParams,
                                compileStrictly = this.compileStrictly,
                                path = this.path,
                                route = this.route,
                                q = this.q,
                                used = {};

                            if (angular.isObject(params)) {
                                if (this.defaults) {
                                    params = copy(params);

                                    for (var k in this.defaults) {
                                        k in params || (params[k] = this.defaults[k]);
                                    }
                                }
                            } else {
                                params = this.defaults;
                            }

                            if (angular.isObject(params)) {
                                if (path) {
                                    forEach(this.routeParams, function (v) {
                                        if (v in params && params[v] !== void 0) {
                                            path = path.replace('!@$#' + v + '#$@!', params[v].toString());

                                            used[v] = true;
                                        } else {
                                            if (compileStrictly) {
                                                throw new Error('Path parameter missing: ' + v + ' on ' + route);
                                            }
                                        }
                                    });
                                }

                                if (q) {
                                    forEach(this.routeParams, function (v) {
                                        if (v in params && params[v] !== void 0) {
                                            q = q.replace('!@$#' + v + '#$@!', encodeURIComponent(params[v].toString()));

                                            used[v] = true;
                                        } else {
                                            if (compileStrictly) {
                                                throw new Error('Path parameter missing: ' + v + ' on ' + route);
                                            }
                                        }
                                    });
                                }

                                if (appendParams) {
                                    forEach(params, function (v, k) {
                                        if (! (k in used) && v !== void 0) {
                                            q || (q = '');

                                            q = q + '&' + k + '=' + encodeURIComponent(v.toString());
                                        }
                                    });
                                }
                            }

                            return q ? path + '?' + q : path;
                        },

                        delete: function (params, data, options) {
                            return $http.delete(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        get: function (params, data, options) {
                            return $http.get(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        head: function (params, data, options) {
                            return $http.head(this.compileQuery(params), extend(options || {}, {data: data}));
                        },

                        options: function (params, data, options) {
                            return $http.options(this.compileQuery(params), data, options);
                        },

                        patch: function (params, data, options) {
                            return $http.patch(this.compileQuery(params), data, options);
                        },

                        post: function (params, data, options) {
                            return $http.post(this.compileQuery(params), data, options);
                        },

                        put: function (params, data, options) {
                            return $http.put(this.compileQuery(params), data, options);
                        },

                        trace: function (params, data, options) {
                            return $http.trace(this.compileQuery(params), data, options);
                        }

                    };

                    function Resty(base, routes)
                    {
                        this.base = base;
                        this.defaults = null;
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

                        setDefaults: function (value) {
                            this.defaults = angular.isObject(value) ? value : null;

                            return this;
                        },

                        setErrorHandler: function (value) {
                            this.errorHandler = angular.isFunction(value) ? value : null;

                            return this;
                        },

                        setQueued: function (value) {
                            this.queued = value === true;

                            return this;
                        },

                        setRawResponse: function (value) {
                            this.rawResponse = value === true;

                            return this;
                        },

                        setResponseSimpleOnce: function (value) {
                            this.responseSimpleOnce = value === true;

                            return this;
                        },

                        setSuccessHandler: function (value) {
                            this.successHandler = angular.isFunction(value) ? value : null;

                            return this;
                        },

                        addRoutes: function (routes) {
                            if (angular.isObject(routes)) {
                                forEach(routes, function (v, k) {
                                    var appendParams = false,
                                        compileStrictly = true,
                                        defaults = {},
                                        errorHandler,
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

                                            appendParams = v[2] === true;
                                            defaults = angular.isObject(v[3]) ? v[3] : this.defaults;
                                            method = v[1] || 'get';
                                            route = this.base + '/' + v[0];
                                        } else {
                                            appendParams = v.appendParams === true;
                                            compileStrictly = v.compileStrictly !== false;
                                            defaults = angular.isObject(v.defaults) ? v.defaults : this.defaults;
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
                                        route = new Route(route, compileStrictly, appendParams, defaults);

                                        routes[k] = this[k] = function (params, data, options) {
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

                    function factory(base, routes)
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
        .module('Entity', ['ng', 'Resty'])
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
                     * Fake transport with CRUD.
                     */
                    var $restyFake = {

                        getAll: function () {
                            return $q.resolve();
                        },

                        getOne: function () {
                            return $q.resolve();
                        },

                        create: function () {
                            return $q.resolve();
                        },

                        delete: function () {
                            return $q.resolve();
                        },

                        update: function () {
                            return $q.resolve();
                        }

                    };

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
                    function EntityCollection(alias, scope, mappedProperty, transport, methods)
                    {
                        if (angular.isString(alias) === false) {
                            throw new Error('Incorrect [alias].');
                        }

                        if (angular.isString(mappedProperty) === false && angular.isFunction(mappedProperty) === false) {
                            throw new Error('Incorrect [mappedProperty].');
                        }

                        if (angular.isObject(transport) === false) {
                            transport = $restyFake;
                        }

                        this.alias = alias;
                        this.allMethod = 'getAll';
                        this.delMethod = 'delete';
                        this.defaults = void 0;
                        this.k = null;
                        this.mappedProperty = mappedProperty;
                        this.methods = methods && {};
                        this.modelCache = {};
                        this.modelCacheIndex = 10000000;
                        this.modelMapper = null;
                        this.oneMethod = 'getOne';
                        this.putMethods = ['create', 'update'];
                        this.relations = {};
                        this.scope = scope;
                        this.transport = transport;
                        this.transportOptions = {};
                        this.wantWatcher = false;

                        // wrap transport routes methods
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

                        // wrap custom model methods
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

                    EntityCollection.prototype = {

                        setAll: function (value) {
                            this.allMethod = value;

                            return this;
                        },

                        setDefaults: function (value) {
                            this.defaults = value;

                            return this;
                        },

                        setDel: function (func) {
                            this.delMethod = func;

                            return this;
                        },

                        setOne: function (func) {
                            this.oneMethod = func;

                            return this;
                        },

                        setPut: function (funcCreate, funcUpdate) {
                            this.putMethods = [funcCreate, funcUpdate];

                            return this;
                        },

                        /**
                         * Set model mapper. [string] will be used as collection key.
                         *
                         * @param value
                         * @returns {EntityCollection}
                         */
                        setModelMapper: function (value) {
                            this.modelMapper = value;

                            return this;
                        },

                        setOneToOne: function(alias, entity, l, r) {
                            this.relations[alias] = [entity.setOneToOne(this.alias, EntityCollection.RELATION_ONE_TO_ONE), EntityCollection.RELATION_ONE_TO_ONE, l, r];

                            return this;
                        },

                        setOneToMany: function(alias, entity, l, r) {
                            this.relations[alias] = [entity.setOneToOne(this.alias, EntityCollection.RELATION_ONE_TO_ONE), EntityCollection.RELATION_ONE_TO_MANY, l, r];

                            return this;
                        },

                        setTransport: function (value) {
                            this.transport = value;

                            return this;
                        },

                        setTransportOptions: function (value) {
                            this.transportOptions = angular.isObject(value) ? value : {};

                            return this;
                        },

                        setWantWatcher: function (value) {
                            this.wantWatcher = value === true;

                            return this;
                        },

                        get: function (k, defaultValue) {
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

                        set: function (k, value) {
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

                        getRelated: function (alias, query) {
                            if (alias in this.relations) {

                            }

                            throw new Error('Relation is not defined: ' + alias);
                        },

                        setRelated: function (alias, query, model) {
                            if (alias in this.relations) {

                            }

                            throw new Error('Relation is not defined: ' + alias);
                        },

                        all: function (query) {
                            if (angular.isFunction(this.transport[this.allMethod]) === false) {
                                throw new Error('[getAll] transport method required.');
                            }

                            return $q(function (resolve, reject) {
                                this.transport.responseSimpleOnce = true;

                                this.transport[this.allMethod](query).then(
                                    function (res) {
                                        angular.isFunction(this.mappedProperty)
                                            ? this.mappedProperty(this.scope, res, true)
                                            : this.scope[this.mappedProperty] = res;

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        append: function (k, v) {
                            var val = v === void 0 ? k : v;

                            if (angular.isArray(this.scope[this.mappedProperty]) && (v === void 0 || k >= this.scope[this.mappedProperty].length)) {
                                this.scope[this.mappedProperty].push(val);
                            } else {
                                this.scope[this.mappedProperty][k] = val;
                            }

                            return this;
                        },

                        clear: function () {
                            angular.isString(this.mappedProperty) ? this.scope[this.mappedProperty] = {} : this.mappedProperty(this.scope, void 0, []);

                            this.modelCache = {};

                            return this;
                        },

                        collection: function () {
                            return this;
                        },

                        del: function (k) {
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

                        on: function (k, defaults) {
                            var $$isNew = false;

                            if (k in this.scope[this.mappedProperty]) {
                                this.k = k;
                            } else {
                                defaults = defaults ? extend(defaults, this.defaults) : this.defaults;

                                if (defaults !== void 0) {
                                    this.k = this.set(k, defaults);

                                    $$isNew = true;
                                } else {
                                    throw new Error('Key is not defined: ' + k);
                                }
                            }

                            if ('$$isCached' in this.scope[this.mappedProperty][this.k]) {
                                return this.modelCache[this.scope[this.mappedProperty][this.k].$$isCached];
                            }

                            var model = this.modelCache[this.modelCacheIndex ++] = factoryEntityModel(this, this.k, $$isNew);

                            this.get(this.k).$$isCached = this.modelCacheIndex - 1;

                            return model;
                        },

                        one: function (query, asProperty) {
                            if (angular.isFunction(this.transport[this.oneMethod]) === false) {
                                throw new Error('[getOne] transport method required.');
                            }

                            return $q(function (resolve, reject) {
                                this.transport.responseSimpleOnce = true;

                                this.transport[this.oneMethod](query).then(
                                    function (res) {
                                        var k = angular.isFunction(this.mappedProperty)
                                            ? this.mappedProperty(this.scope, asProperty || true, res)
                                            : this.set(asProperty || res[this.modelMapper], res);

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                );
                            }.bind(this));
                        },

                        put: function (k, $$asNew) {
                            if (angular.isFunction(this.transport[this.putMethods[0]]) === false || angular.isFunction(this.transport[this.putMethods[1]]) === false) {
                                throw new Error('[create] or [update] transport method required.');
                            }

                            var promises = [];

                            forEach(k !== void 0 ? [this.get(k)] : this.get(), function (v) {
                                promises.push(this.transport[this.putMethods[$$asNew === true ? 0 : 1]](v, v));
                            }.bind(this));

                            return $q.all(promises);
                        },

                        remove: function (k) {
                            delete this.modelCache[this.scope[this.mappedProperty][k].$$isCached];

                            if (angular.isArray(this.scope[this.mappedProperty])) {
                                this.scope[this.mappedProperty].splice(k, 1);
                            } else {
                                delete this.scope[this.mappedProperty][k];
                            }

                            return this;
                        }

                    };

                    function EntityModel(context, key, $$isNew)
                    {
                        this.$$isDirty = this.$$isNew = $$isNew === true;

                        this.get = function (k, defaultValue) {
                            return context.get(key + '.' + k, defaultValue);
                        };

                        this.set = function (k, v) {
                            this.$$isDirty = true;

                            return context.set(key + '.' + k, v) ? this : this;
                        };

                        this.collection = function () {
                            return context;
                        };

                        this.dirty = function (value) {
                            this.$$isDirty = value !== false;

                            return this;
                        };

                        this.del = function () {
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

                        this.put = function () {
                            return $q(function (resolve, reject) {
                                this.$$isDirty ? context.put(key, this.$$isNew).then(
                                    function (res) {
                                        this.$$isDirty = this.$$isNew = false;

                                        resolve(res);
                                    }.bind(this),
                                    reject
                                ) : resolve();
                            }.bind(this));
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

                    function factory(alias, scope, mappedProperty, transport, methods)
                    {
                        return new EntityCollection(alias, scope, mappedProperty, transport, methods);
                    }

                    function factoryEntityModel(context, key, $$isNew)
                    {
                        return new (EntityModel.setPrototype(context.get(key)))(context, key, $$isNew);
                    }

                    return factory;
                }
            ]
        );

})(window, window.angular);

if (typeof module !== 'undefined' && typeof exports !== 'undefined' && module.exports === exports){
    module.exports = 'angular-entity';
}
