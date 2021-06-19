(function (window, angular) {
    var module = angular.module('framework.services.data', []);

    module.provider('Model', modelsProvider);
    //module.service('DataContext', dataService);

    function modelsProvider() {
        var schemas = {

        };

        this.registerSchema = registerSchema;
        this.$get = buildService;

        function registerSchema(name, path, schema) {
            schemas[name] = [path, schema];
            return this;
        }

        buildService.$inject = ['$config', '$http', '$q'];

        function buildService($config, $http, $q) {
            var models = {};

            models.$associate = function (type1, type2, id1, id2) {
                return $http.get($config.API_ENDPOINT + '/api/tags', {
                    params: {
                        type1: type1,
                        type2: type2,
                        id1: id1,
                        id2: id2
                    }
                });
            }

            models.$dissociate = function (type1, type2, id1, id2) {
                return $http.delete($config.API_ENDPOINT + '/api/tags', {
                    params: {
                        type1: type1,
                        type2: type2,
                        id1: id1,
                        id2: id2
                    }
                });
            }

            angular.forEach(schemas, function (value, key) {
                var modelName = key;
                var modelPath = value[0];
                var modelSchema = value[1];
                models[modelName] = BuildConstructor(modelPath, modelSchema);
            });

            return models;

            function Entity(apiEndpoint, schema, values) {
                this.$$apiLocation = apiEndpoint;
                this.$$schema = schema;
                this.$$originalValues = {};
                this.$$changedValues = {};
                this.$$foreignModels = {};

                this.$getChanges = getChanges;
                this.$validate = validateEntity;
                this.$save = saveEntity;
                this.$update = updateEntity;
                this.$patch = patchEntity;
                this.$delete = deleteEntity;
                this.$commit = commitEntity;
                this.$rollback = rollbackEntity;

                angular.forEach(schema, function (value, key) {
                    var fieldName = key,
                        fieldDef = value;
                    if (values[fieldName] !== undefined) {
                        if (fieldDef.type === moment && values[fieldName] !== null) {
                            this.$$originalValues[fieldName] = new Date(values[fieldName]);
                        } else if (typeof fieldDef.type === 'string' && values[fieldName] !== null) {
                            if (fieldDef.nested || typeof (values[fieldName]) == 'object') {
                                this.$$originalValues[fieldName] = new models[fieldDef.type](values[fieldName]);
                                this.$$foreignModels[fieldName] = fieldDef.type;
                            } else {
                                this.$$originalValues[fieldName] = values[fieldName];
                            }
                        } else {
                            this.$$originalValues[fieldName] = values[fieldName];
                        }
                    } else {
                        this.$$originalValues[fieldName] = angular.isArray(fieldDef.defaultValue) ? [] : fieldDef.defaultValue;
                    }

                    Object.defineProperty(this, fieldName, {
                        configurable: false,
                        enumerable: true,
                        get: fieldDef.calculated || function () {
                            return this.$$changedValues.hasOwnProperty(fieldName) ?
                                this.$$changedValues[fieldName] : this.$$originalValues[fieldName];
                        },
                        set: function (value) {
                            if (angular.isUndefined(fieldDef.editable) || fieldDef.editable) {
                                this.$$changedValues[fieldName] = value; //CHECK: Cast to correct type?? 
                            } 
                        }
                    });
                }, this);

                function getChanges() {
                    return this.$$changedValues;
                }

                function validateEntity() { } //TODO
                function saveEntity() {
                    var self = this;
                    var sendable = angular.copy(this);
                    for (var key in sendable) {
                        if (key[0] == '_' || key[0] == '$') {
                            delete sendable[key];
                        }
                    }
                    var request = $http.post($config.API_ENDPOINT + this.$$apiLocation, this);
                    request.success(function (d) {
                        self.$$originalValues.Id = d.Id;
                        self.$commit(true);
                    });
                    return request;
                }

                function updateEntity() {
                    var self = this;
                    var sendable = angular.copy(this);
                    for (var key in sendable) {
                        if (key[0] == '_' || key[0] == '$') {
                            delete sendable[key];
                        }
                    }
                    var config = {
                        params: {
                            id: this.Id
                        }
                    };
                    var request = $http.put($config.API_ENDPOINT + this.$$apiLocation, sendable, config);
                    request.success(function () {
                        self.$commit(true);
                    });
                    return request;
                }

                function patchEntity(skipSubObjects) {
                    var self = this;
                    var delta = angular.extend({
                        Id: this.Id
                    }, this.$getChanges());
                    if (!skipSubObjects) {
                        angular.forEach(this.$$foreignModels, function (value, key) {
                            if(this[key]) {
                                var subChanges = this[key].$getChanges();
                                var count = 0;
                                for (k in subChanges)
                                    if (subChanges.hasOwnProperty(k)) count++;
                                if (count > 0) {
                                    delta[key] = subChanges;
                                }
                            }
                        }, this);
                    }
                    var config = {
                        params: {
                            id: this.Id
                        }
                    };
                    var request = $http.patch($config.API_ENDPOINT + this.$$apiLocation, delta, config);
                    request.success(function () {
                        self.$commit(true);
                    });
                    return request;
                }

                function deleteEntity() {
                    var config = {
                        params: {
                            id: this.Id
                        }
                    };
                    return $http.delete($config.API_ENDPOINT + this.$$apiLocation, config);
                }

                function commitEntity(skipSubObjects) {
                    angular.forEach(this.$$changedValues, function (value, key) {
                        var fieldName = key,
                            fieldValue = value;
                        this.$$originalValues[fieldName] = fieldValue
                    }, this);
                    this.$$changedValues = {};

                    if (skipSubObjects) return;
                    angular.forEach(this.$$foreignModels, function (value, key) {
                        this[key].$commit();
                    }, this);
                }

                function rollbackEntity(skipSubObjects) {
                    this.$$changedValues = {};

                    if (skipSubObjects) return;
                    angular.forEach(this.$$foreignModels, function (value, key) {
                        this[key].$rollback();
                    }, this);
                }
            }
            idCounter = 0;
            function Query(apiEndpoint, ctor, cloneVals) {
                if (cloneVals == null) {
                    cloneVals = {};
                }
                var id = idCounter++;
                var includes = cloneVals.includes || [];
                var selects = cloneVals.selects || [];
                var filters = cloneVals.filters || [];
                var top = cloneVals.top || null;
                var skip = cloneVals.skip || null;
                var orderBy = cloneVals.orderBy || [];
                var modelCtor = ctor;
                this.include = include;
                this.select = select;
                this.filter = filter;
                this.where = filter;
                this.orderBy = orderByFn;
                this.top = topFn;
                this.skip = skipFn;
                this.parseAs = parseAs;
                this.execute = execute;
                this.trackingEnabled = trackingEnabled;
                this.raw = raw;
                this.page = page;
                this.clone = clone;
                this.getInnerValues = getInnerValues;
                var requestType = cloneVals.requestType || "default";

                function getInnerValues() {
                    return {
                        id: id,
                        includes: includes,
                        selects: selects,
                        filters: filters,
                        top: top,
                        skip: skip,
                        orderBy: orderBy,
                        requestType: requestType
                    }
                }

                function clone(options) {
                    var cloneOptions = {};
                    if (options) {
                        if (options.includes) {
                            cloneOptions.includes = angular.copy(includes);
                        }
                        if (options.selects) {
                            cloneOptions.selects = angular.copy(selects);
                        }
                        if (options.filters) {
                            cloneOptions.filters = angular.copy(filters);
                        }
                        if (options.top) {
                            cloneOptions.top = angular.copy(top);
                        }
                        if (options.skip) {
                            cloneOptions.skip = angular.copy(skip);
                        }
                        if (options.orderBy) {
                            cloneOptions.orderBy = angular.copy(orderBy);
                        }
                        if (options.requestType) {
                            cloneOptions.requestType = angular.copy(requestType);
                        }
                    } else {
                        var cloneOptions = {
                            includes: angular.copy(includes),
                            selects: angular.copy(selects),
                            filters: angular.copy(filters),
                            top: angular.copy(top),
                            skip: angular.copy(skip),
                            orderBy: angular.copy(orderBy),
                            requestType: angular.copy(requestType)
                        }
                    }
                    return new Query(apiEndpoint, ctor, cloneOptions);
                }

                function page(page, perPage) {
                    skip = (page - 1) * perPage;
                    top = perPage;
                }

                function parseAs(parser) {;
                    modelCtor = parser;
                    requestType = "tracking";
                    return this;
                }

                function raw() {;
                    requestType = "raw";
                    return this;
                }

                function trackingEnabled() {
                    requestType = "tracking";
                    return this;
                }

                function topFn(val) {
                    top = val;
                    return this;
                }

                function skipFn(val) {
                    skip = val;
                    return this;
                }

                function orderByFn() {
                    [].push.apply(orderBy, arguments);
                    return this;
                }

                function include() {
                    if (arguments.length === 2) {
                        if (angular.isObject(arguments[1])) {
                            //TODO: Process subquery
                        } else if (angular.isFunction(arguments[1])) {
                            //TODO: Process subquery
                        }
                    } else {
                        [].push.apply(includes, arguments);
                    }
                    return this;
                }

                function select() {
                    [].push.apply(selects, arguments);
                    modelCtor = null;
                    return this;
                }

                function filter(key, op, value) {
                    if (arguments.length === 1) {
                        filters.push(key);
                    } else if (arguments.length === 3) {
                        switch (op) {
                            case '&&':
                                op = 'and';
                                break;
                            case '||':
                                op = 'or';
                                break;
                            case '=':
                            case '==':
                            case '===':
                                op = 'eq';
                                break;
                            case '!=':
                            case '!==':
                            case '!===':
                                op = 'ne';
                                break;
                            case '>':
                                op = 'gt';
                                break;
                            case '>=':
                                op = 'ge';
                                break;
                            case '<':
                                op = 'lt';
                                break;
                            case '<=':
                                op = 'le';
                                break;
                            default:
                                break;
                        }
                        filters.push(key + ' ' + op + ' ' + value);
                    }
                    return this;
                }

                function execute() {
                    var config = {};
                    config.params = _buildParams();
                    apiCall = $config.API_ENDPOINT + apiEndpoint;
                    return $http.get(apiCall, config).then(function (response) {
                        if (requestType == "raw")
                            return response.data;
                        else if (requestType == "tracking") {
                            if (modelCtor == null)
                                modelCtor = ctor;
                            if (angular.isArray(response.data)) {
                                var results = [];
                                angular.forEach(response.data, function (d) {
                                    results.push(new modelCtor(d));
                                });
                                return results;
                            } else
                                return new modelCtor(response.data);
                        } else {
                            if (angular.isArray(response.data)) {
                                var results = [];
                                for (j = 0, leng = response.data.length; j < leng; j++)
                                    results.push(generateDefaultObject(response.data[j], ctor.$schema))
                                return results;
                            } else
                                return generateDefaultObject(response.data, ctor.$schema);
                        }
                    })
                }

                function generateDefaultObject(data, schema) {
                    var obj = {};

                    for (var property in schema) {
                        if (schema[property].calculated) {
                            Object.defineProperty(obj, property, {
                                configurable: false,
                                enumerable: true,
                                get: schema[property].calculated
                            })
                        }
                        else if (data[property] && typeof schema[property].type === 'string') {
                            var _schema = schemas[schema[property].type];
                            if (_schema) {
                                obj[property] = generateDefaultObject(data[property], _schema[1]);
                            }
                            else {
                                obj[property] = data[property];
                            }
                        }
                        else {
                            if (schema[property].type === moment)
                                obj[property] = (data[property]) ? new Date(data[property]) : null;
                            else
                                obj[property] = data[property];
                        }
                    }
                    return obj;
                }

                function _buildParams() {
                    var params = {};
                    if (includes.length) {
                        params.$expand = includes.join(',');
                    }
                    if (filters.length) {
                        params.$filter = filters.join(' and ');
                    }
                    if (orderBy.length) {
                        params.$orderby = orderBy.join(',');
                    }
                    if (selects.length) {
                        params.$select = selects.join(',');
                    }
                    if (top) {
                        params.$top = top;
                    }
                    if (skip) {
                        params.$skip = skip;
                    }
                    return params;
                }
            }

            function ModelCache() {

            }

            function BuildConstructor(apiEndpoint, schema) {
                function ModelCtor(values) {
                    var values = values || {};
                    this.base = Entity;
                    this.base(apiEndpoint, schema, values);
                }

                ModelCtor.prototype = new Entity;
                ModelCtor.$schema = schema;
                ModelCtor.query = query;
                ModelCtor.getById = getById;
                var passon = ModelCtor;

                function query() {
                    return new Query(apiEndpoint, passon);
                }

                function getById(id) {
                    return new Query(apiEndpoint)
                        .filter('Id', 'eq', id);
                }

                return ModelCtor;
            }
        }
    }

    dataService.$inject = ['$config', '$http', '$q', 'Models'];

    function dataService($config, $http, $q, Models) {
        var entityIdMaps = {};
        var entityArrays = {};

    }
})(window, angular);