(function (window, angular) {
    var app = angular.module("framework.services.logging", []);

    app.provider('Logger', function () {
        var providers = [];
        var hiddenCatagorys = [];
        var loggingLevel = 1;

        this.DEBUG = 1;
        this.INFO = 2;
        this.WARNING = 3;
        this.ERROR = 4;

        this.setGlobalLoggingLevel = setGlobalLoggingLevel;
        this.addProvider = addProvider;
        this.hideCatagory = hideCatagory;

        function setGlobalLoggingLevel(level) {
            loggingLevel = level;
        }

        function addProvider(provider) {
            providers.push(provider);
        }

        function hideCatagory(catagory) {
            hiddenCatagorys.push(catagory);
        }

        this.$get = buildLoggerService;

        buildLoggerService.$inject = ['$injector'];
        function buildLoggerService($injector) {
            var instance = createLogger('Default');
            this.createLogger = createLogger;
            this.log = instance.log;
            this.debug = instance.debug;
            this.info = instance.info;
            this.warning = instance.warning;
            this.error = instance.error;
            this.DEBUG = 1;
            this.INFO = 2;
            this.WARNING = 3;
            this.ERROR = 4;
            var concreteProviders = [];
            angular.forEach(providers, function (value) {
                if (angular.isObject(value)) {
                    concreteProviders.push(value);
                } else if (angular.isFunction(value)) {
                    var pro = {
                        log: value,
                        debug: log.bind(null, 1),
                        info: log.bind(null, 2),
                        warning: log.bind(null, 3),
                        error: log.bind(null, 4)
                    };
                    concreteProviders.push(pro);
                } else if (angular.isArray(value)) {
                    var pro = $injector.invoke(value, null, {
                        Levels: {
                            DEBUG: 1,
                            INFO: 2,
                            WARNING: 3,
                            ERROR: 4
                        }
                    });
                    concreteProviders.push(pro);
                } else if (typeof value === 'string') {
                    var pro = $injector.get(value);
                    concreteProviders.push(pro);
                }
            });

            function createLogger(catagory) {
                return new Logger(catagory, concreteProviders, loggingLevel, hiddenCatagorys);
            }

            return this;
        }
    });

    function Logger(catagory, providers, loggingLevel, hiddenCatagorys) {
        this.log = log;
        this.debug = debug;
        this.info = info;
        this.warning = warning;
        this.error = error;

        function log(level, msg) {
            if (level < loggingLevel || hiddenCatagorys.indexOf(catagory) != -1)
                return;
            
            var args = Array.prototype.slice.call(arguments, 2);
            angular.forEach(providers, function (provider) {
                provider.log(level, catagory, msg, args);
            });
        }

        function debug(msg) {
            if (1 < loggingLevel || hiddenCatagorys.indexOf(catagory) != -1)
                return;

            var args = Array.prototype.slice.call(arguments, 1);
            angular.forEach(providers, function (provider) {
                provider.debug(catagory, msg, args);
            });
        }

        function info(msg) {
            if (2 < loggingLevel || hiddenCatagorys.indexOf(catagory) != -1)
                return;

            var args = Array.prototype.slice.call(arguments, 1);
            angular.forEach(providers, function (provider) {
                provider.info(catagory, msg, args);
            });
        }

        function warning(msg) {
            if (3 < loggingLevel || hiddenCatagorys.indexOf(catagory) != -1)
                return;

            var args = Array.prototype.slice.call(arguments, 1);
            angular.forEach(providers, function (provider) {
                provider.warning(catagory, msg, args);
            });
        }

        function error(msg, exception) {
            if (4 < loggingLevel || hiddenCatagorys.indexOf(catagory) != -1)
                return;

            var args = Array.prototype.slice.call(arguments, 2);
            angular.forEach(providers, function (provider) {
                provider.error(catagory, msg, exception, args);
            });
        }
    }
})(window, angular);