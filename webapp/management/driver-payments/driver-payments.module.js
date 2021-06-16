(function (window, angular) {
    return;
    var module = angular.module('cab9.driverpayments', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }

    function formatUrl(ImageUrl, text) {
        if (ImageUrl) {
            if (ImageUrl.slice(0, 4) == 'http') {
                return ImageUrl;
            } else {
                return window.resourceEndpoint + ImageUrl;
            }
        } else {
            return $config.API_ENDPOINT + 'api/imagegen?text=' + text;
        }
    }
})(window, angular);