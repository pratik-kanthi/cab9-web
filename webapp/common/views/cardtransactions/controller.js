(function () {
    var module = angular.module('cab9.common');

    module.controller('InvoiceCardTransactionsController', InvoiceCardTransactionsController);

    InvoiceCardTransactionsController.$inject = ['$scope', '$modal', '$state', 'Model', '$timeout', '$http', 'CSV', '$filter', '$rootScope'];

    function InvoiceCardTransactionsController($scope, $modal, $state, Model, $timeout, $http, CSV, $filter, $rootScope) {
        $scope.dateChanged = dateChanged;
        $scope.transactions = [];
        $scope.filters = {
        	from: new moment().add(-7, 'days').toDate(),
        	to: new moment().toDate(),
        	type: undefined,
        	result: undefined
        }

        $scope.opened = {};
        $scope.fetchTransactions = fetchTransactions;
        $scope.expandTransaction = expandTransaction;

        $scope.exportTransactions = exportTransactions;

        $scope.fetchTransactions();

        function fetchTransactions() {
            $scope.fetchingTransactions = true;
            if($rootScope.CLIENTID){
                var transactionQuery = $config.API_ENDPOINT + "api/Transactions/TransactionsBetweenDate?startDate=" + moment($scope.filters.from).format("YYYY-MM-DD") + "&endDate="+moment($scope.filters.to).format("YYYY-MM-DD") + "&clientId=" + $rootScope.CLIENTID;
            } else{ 
                var transactionQuery = $config.API_ENDPOINT + "api/Transactions/TransactionsBetweenDate?startDate=" + moment($scope.filters.from).format("YYYY-MM-DD") + "&endDate="+moment($scope.filters.to).format("YYYY-MM-DD");
            }
            

            //fetch transactions
            $http({
                method: 'GET',
                url: transactionQuery
            }).then(function successCallback(response) {
                $scope.transactions = response.data;

                $scope.bTransactions = [];
                $scope.iTransactions = [];

                $scope.transactions.map(function(t) {

                    if(t.TransactionType == "Collection" || t.TransactionType == "Payment") {
                        t._TransactionType = "Payment";
                    } else {
                        t._TransactionType = "Preauth";
                    }

                    if(t.BookingId != null)
                        $scope.bTransactions.push(t);
                    else
                        $scope.iTransactions.push(t);
                });


                $scope.fetchingTransactions = false;
            }, function errorCallback(error) {
                $scope.fetchingTransactions = false;
                if(error && error.data && error.data.Message) {
                	swal("Invalid Date", error.data.Message, "error");
                } else {
                	swal("Error", "Unknown Error Occured" , "error");
                }
            });

        }

        function dateChanged() {
        	var startDate = moment($scope.filters.from);
        	var endDate = moment($scope.filters.to);
        	if(startDate > endDate) {
        		swal("Invalid Date", "Start Date can not be after End Date.", "error");
        		return;
        	}
        	if(endDate.diff(startDate, 'days') > 30) {
        		swal("Invalid Date", "Requested days can not be more than 7 days apart.", "error");
        		return;
        	}
			$scope.transactions = [];
        	fetchTransactions();
        }

        function exportTransactions() {
            var transactions = angular.copy($scope.transactions);
            
            transactions = $filter("filter")(transactions, {'_TransactionType':$scope.filters.type, 'Success':$scope.filters.result, $:$scope.searchText});

            transactions.map(function(t) {
                if(t.Success == true) {
                    switch (t.Provider) {
                        case 'Judopay':
                        try {
                            t.ReceiptId = JSON.parse(t.Response).ReceiptId;
                            if(t.ReceiptId == null) 
                                t.ReceiptId = JSON.parse(t.Response).Response.ReceiptId;
                        } catch(exc) {

                        }
                        break;

                        case 'Stripe':
                        try {
                            t.ReceiptId = JSON.parse(t.Response).id;
                        } catch(exc) {

                        }
                        break;
                    }
                    t.Status = 'SUCCESS'
                } else {
                    t.Status = 'FAIL'
                }
                t.Booking = t.LocalId;
                t.CreatedAt = moment(t.CreatedAt).format("DD/MM/YYYY HH:mm");
                delete t.LocalId;
                delete t.Request;
                delete t.Response;
                delete t.Success;
                delete t.TenantId;
                delete t.Id;
                delete t.BookingId;
                delete t.PaymentCardId;
                delete t.InvoiceId;
            });

            CSV.download(transactions, "Transactions");

        }

        $scope.openCalendar = function (event, name) {
            $scope.opened[name] = true;
            event.preventDefault();
            event.stopPropagation();
        }

        function expandTransaction(item) {
            item.$expanded = true;
            item.Request = JSON.parse(item.Request);
            item.Response = JSON.parse(item.Response);
        }
    }
}())