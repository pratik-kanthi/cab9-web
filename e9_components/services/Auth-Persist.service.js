(function (window, angular) {
	var app = angular.module("framework.services.auth.persist", ['framework.services.auth']);

	app.config(config);
	app.run(run);

	config.$inject = ['AuthProvider'];
	function config(AuthProvider) {
		var item;
		if ((item = localStorage.getItem('AUTH_TKN'))) {
			try {
			    var parsed = angular.fromJson(item);
				AuthProvider.setSession(parsed);

			} catch (e) {
				console.log(e);
			}
		}
	}

	run.$inject = ['$rootScope', 'AUTH_EVENTS', '$localStorage','$config'];
	function run($rootScope, AUTH_EVENTS, $localStorage, $config) {
		$rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function (event, session) {
			$localStorage.AUTH_TKN = session;
		});

		$rootScope.$on(AUTH_EVENTS.LOGIN_REFRESH, function (event, session) {
		    localStorage.setItem('AUTH_TKN', JSON.stringify(session));
		    console.log('refreshing');
		    if (window.location.hash.indexOf('login') != -1) {
		        window.location.hash = '';
		    }
		    location.reload();
		});

		$rootScope.$on(AUTH_EVENTS.LOGOUT, function (event) {
		    localStorage.removeItem('AUTH_TKN');
		    location.href = $config.LOGIN_URL;
		}); 
	}
})(window, angular);