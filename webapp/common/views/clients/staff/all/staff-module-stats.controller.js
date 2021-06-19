(function (angular) {
	var module = angular.module('cab9.common');

	module.controller('ClientStaffModuleStatsController', clientStaffModuleStatsController);
	clientStaffModuleStatsController.$inject = ['$rootScope', '$scope','$UI','Model','$config', '$http', 'rData', '$stateParams'];
	function clientStaffModuleStatsController($rootScope, $scope, $UI, Model, $config, $http, rData, $stateParams) {
		var recentAfter = new moment().subtract(2, 'week');
		$scope.recentStaff = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
		
        if ($rootScope.CLIENTID) {
            $scope.clientId = $rootScope.CLIENTID;
        } else {
            $scope.clientId = $stateParams.Id;
        }
        
        Model.ClientStaff
            .query()
            .filter("ClientId eq guid'" + $scope.clientId + "'")
            .select('Id,Active,CreationTime')
            .execute().then(function(data) {
                $scope.recentStaff = data.filter(function(d) {
                    return new moment(d.CreationTime).isAfter(recentAfter);
                });
                $scope.quickStats = {
                    total: data.length,
                    active: data.filter(function(d) {
                        return d.Active
                    }).length,
                    recent: $scope.recentStaff.length
                };
            });

		$scope.quickStats = {
			total: rData.length,
			active: rData.filter(function(d){ return d.Active }).length,
			recent: $scope.recentStaff.length
		};
		$scope.Staff = [];

	};

}(angular));