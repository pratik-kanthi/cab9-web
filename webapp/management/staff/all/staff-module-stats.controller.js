(function (angular) {
	var module = angular.module('cab9.staff');

	module.controller('StaffModuleStatsController', staffModuleStatsController);
	staffModuleStatsController.$inject = ['$scope','$UI','Model','$config', '$http', 'rData'];
	function staffModuleStatsController($scope, $UI, Model, $config, $http, rData) {
		var recentAfter = new moment().subtract(2, 'week');
		$scope.recentStaff = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
		$scope.quickStats = {
			total: rData.length,
			active: rData.filter(function(d){ return d.Active }).length,
			recent: $scope.recentStaff.length
		};
		$scope.Staff = [];

	};

}(angular));