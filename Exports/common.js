(function (window, angular) {
    var app = angular.module("cab9.export", []);

	window.$config = {
	    API_ENDPOINT: 'http://api.cab9.co/',
	    DEFAULT_LOCALE: 'en-gb'
    };
    
    app.constant('$config', window.$config);

})(window,angular);