(function (angular) {
	var module = angular.module('cab9.drivers');

	module.controller('DriverExpenseController', DriverExpenseController);

	DriverExpenseController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$rootScope', 'Notification', '$state'];

	function DriverExpenseController($scope, $modal, Model, $q, $http, $config, $rootScope, Notification, $state) {
		$scope.data = [];
		
		$scope.tab = {
			current: 'PENDING'
		};
		$scope.showSearch = false;
		$scope.searchTerm = {};
		$scope.toggleSearch = toggleSearch;
		$scope.acceptExpense = acceptExpense;
		$scope.declineExpense = declineExpense;
		$scope.deleteExpense = deleteExpense;

		function toggleSearch() {
			$scope.showSearch = !$scope.showSearch;
			if (!$scope.showSearch) {
				$scope.searchTerm.$ = '';
			} else {
				setTimeout(function () {
					$('#searchTerm').focus();
				}, 500);
			}
		}
		$scope.openEditModal = openEditModal;

		$scope.formatUrl = window.$utilities.formatUrl;
		$scope.AllExpenses = [];
        $scope.ApprovedExpenses = [];
        $scope.PendingExpenses = [];
        $scope.DeclinedExpenses = [];

		$scope.fetch = function() {
			$scope.fetching = true;
			$http.get($config.API_ENDPOINT + 'api/Expense/DriverExpenses')
				.then(function (response) {
					$scope.fetching = false;
					$scope.AllExpenses = response.data;
					$scope.processExpensesList($scope.AllExpenses);
				}, function(error) {
					swal("Error", "Something didn't work, please try again", "error");
					$scope.fetching = false;
				})
		}

		$scope.fetch();

		function openEditModal($event, expense) {
			window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + expense.BookingId + '&clientId=' + expense.ClientId, 'EDIT:' + expense.BookingId, 'height=850,width=1000,left=0,top=0');
			$event.stopPropagation();
		}

		$scope.processExpensesList = function (allExpenses) {
			$scope.ApprovedExpenses = [];
        	$scope.PendingExpenses = [];
        	$scope.DeclinedExpenses = [];
			for (i = 0; i < allExpenses.length; i++) {
				var _ex = allExpenses[i];
				if (_ex.Approved == true) {
					_ex.$Status = "Approved";
					$scope.ApprovedExpenses.push(_ex);
				} else if (_ex.Approved == null) {
					_ex.$Status = "Pending";
					$scope.PendingExpenses.push(_ex);
				} else {
					_ex.$Status = "Declined";
					$scope.DeclinedExpenses.push(_ex);
				}
			}
		}

		function acceptExpense(expense) {
			$http.patch($config.API_ENDPOINT + 'api/Expense/bookingexpense?BookingExpenseId=' + expense.ExpenseId + '&Status=true').then(function (response) {
				Notification.success("Expense Approved");
				
				$scope.fetch();
			}, function (err) {
				swal("Error", "Something didn't work, please try again", "error");
			})
		}

		function declineExpense(expense) {
			swal({
				title: "Confirm Decline",
				text: "Are you sure you want to decline this expense?",
				type: "warning",
				showCancelButton: true,
				confirmButtonText: "Confirm Decline",
			}, function () {
				$http.patch($config.API_ENDPOINT + 'api/Expense/bookingexpense?BookingExpenseId=' + expense.ExpenseId + '&Status=false').then(function (response) {
					Notification.warning("Expense Declined");

					
					$scope.fetch();

				}, function (err) {
					swal("Error", "Something didn't work, please try again", "error");
				})
			});
		}

		function deleteExpense(expense) {
			swal({
				title: "Confirm Delete",
				text: "Are you sure you want to delete this expense?",
				type: "warning",
				showCancelButton: true,
				confirmButtonText: "Confirm Delete",
			}, function () {
				$http.delete($config.API_ENDPOINT + 'api/Expense/bookingExpense?ExpenseId=' + expense.ExpenseId).then(function (response) {
					Notification.warning("Expense Deleted");					
					$scope.fetch();
				}, function (err) {
					swal("Error", "Something didn't work, please try again", "error");
				})
			});
		}

		var _expenseNotifications  = [];

        $scope.$on('SIGNALR_newExpenseNotification', function(event, data) {
			$scope.AllExpenses.push(data[0]);
			$scope.processExpensesList($scope.AllExpenses);
			$scope.$apply();
        })

        $scope.$on('SIGNALR_declinedExpenseNotification', function(event, data) {
            var found = $scope.AllExpenses.filter(function (dr) {
                return dr.ExpenseId == data[0].ExpenseId;
            });

            if (found.length > 0 ) {
				$scope.AllExpenses.splice($scope.AllExpenses.indexOf(found[0]), 1)
				$scope.AllExpenses.push(data[0]);
				$scope.processExpensesList($scope.AllExpenses);
			}
			$scope.$apply();
        });

        $scope.$on('SIGNALR_approvedExpenseNotification', function(event, data) {
			var found = $scope.AllExpenses.filter(function (dr) {
                return dr.ExpenseId == data[0].ExpenseId;
            });

            if (found.length > 0 ) {
				$scope.AllExpenses.splice($scope.AllExpenses.indexOf(found[0]), 1)
				$scope.AllExpenses.push(data[0]);
				$scope.processExpensesList($scope.AllExpenses);
			}
			$scope.$apply();
		});
		
		$scope.$on('SIGNALR_deletedExpenseNotification', function(event, data) {
			var found = $scope.AllExpenses.filter(function (dr) {
                return dr.ExpenseId == data[0].ExpenseId;
            });

            if (found.length > 0 ) {
				$scope.AllExpenses.splice($scope.AllExpenses.indexOf(found[0]), 1)
				$scope.processExpensesList($scope.AllExpenses);
			}
			$scope.$apply();
        });
	}
})(angular);
