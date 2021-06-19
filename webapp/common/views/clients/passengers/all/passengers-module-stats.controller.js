(function (angular) {
	var module = angular.module('cab9.common');

	module.controller('ClientPassengerModuleStatsController', clientPassengerModuleStatsController);
	clientPassengerModuleStatsController.$inject = ['$scope','$UI','Model','$config', '$http', 'rData', '$stateParams'];
	function clientPassengerModuleStatsController($scope, $UI, Model, $config, $http, rData, $stateParams) {
		var recentAfter = new moment().subtract(2, 'week');
		$scope.recentPassenger = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
		$scope.clientId = $stateParams.Id;

		Model.Passenger
            .query()
            .select('Id,Active,CreationTime')
            .where("ClientId eq guid'" + $stateParams.Id + "'")
            .execute().then(function (data) {
                $scope.recentPassenger = data.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });

                $scope.quickStats = {
                    total: data.length,
                    active: data.filter(function (d) { return d.Active }).length,
                    recent: $scope.recentPassenger.length
                };
            });
        
		$scope.quickStats = {
			total: rData.length,
			active: rData.filter(function(d){ return d.Active }).length,
			recent: $scope.recentPassenger.length
		};
		$scope.Passenger = [];

	};

}(angular));