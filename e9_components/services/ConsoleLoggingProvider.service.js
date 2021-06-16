(function () {
    var app = angular.module('framework.services.logging');

    app.service('ConsoleLoggingProvider', ['$window', consoleLoggingProvider]);

    function consoleLoggingProvider($window) {
        this.log = log;
        this.debug = debug;
        this.info = info;
        this.warning = warning;
        this.error = error;

        function log(level, catagory, msg, others) {
            switch (level) {
                case 1:
                    debug(catagory, msg, others);
                    break;
                case 2:
                    info(catagory, msg, others);
                    break;
                case 3:
                    warning(catagory, msg, others);
                    break;
                case 4:
                    error(catagory, msg, exception, others);
                    break;
                default:
                    debug(catagory, msg, others);
                    break;
            }
        }

        function debug(catagory, msg, others) {
            var date = new Date();
            console.debug(date.toISOString() + ' - ' + catagory.toUpperCase() + ' - ' + msg);
            angular.forEach(others, function (val, ind) {
                console.debug('additional info ' + ind + ': ', val);
            });
        }

        function info(catagory, msg, others) {
            var date = new Date();
            console.info(date.toISOString() + ' - ' + catagory.toUpperCase() + ' - ' + msg);
            angular.forEach(others, function (val, ind) {
                console.info('additional info ' + ind + ': ', val);
            });
        }

        function warning(catagory, msg, others) {
            var date = new Date();
            console.warn(date.toISOString() + ' - ' + catagory.toUpperCase() + ' - ' + msg);
            angular.forEach(others, function (val, ind) {
                console.warn('additional info ' + ind + ': ', val);
            });
        }

        function error(catagory, msg, exception, others) {
            var date = new Date();
            console.error(date.toISOString() + ' - ' + catagory.toUpperCase() + ' - ' + msg);
            console.error('original exception: ' + exception);
            angular.forEach(others, function (val, ind) {
                console.error('additional info ' + ind + ': ', val);
            });
        }
    }
    
})();