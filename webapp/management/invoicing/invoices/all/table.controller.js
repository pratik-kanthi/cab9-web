(function() {
    var module = angular.module('cab9.invoices');

    module.controller('InvoicesModuleTableController', invoicesModuleTableController);

    invoicesModuleTableController.$inject = ['$scope', '$modal', '$state', 'Model', '$timeout', '$http', '$config'];

    function invoicesModuleTableController($scope, $modal, $state, Model, $timeout, $http, $config) {
        $scope.invoices = [];
        $scope.searchTerm = {
            $: ""
        };
        $scope.toggleSearch = toggleSearch;
        $scope.filterInvoices = filterInvoices;
        $scope.showSearch = false;
        $scope.loading = true;

        $scope.openPaymentModal = openPaymentModal;

        $scope.bulkMode = false;

        $scope.selectedRows = [];

        $scope.startBulk = startBulk;
        $scope.cancelBulk = cancelBulk;
        $scope.submitBulk = submitBulk;
        $scope.selectAll = selectAll;
        $scope.anySelected = anySelected;
        $scope.allSelected = allSelected;
        $scope.toggleRowSelection = toggleRowSelection;

        var debounce = null;
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null
        };
        $scope.setPage = setPage;

        $scope.showFilterModal = showFilterModal;
        $scope.filter = {
            date: {
                from: moment().subtract(7, 'days').startOf("isoweek"),
                to: moment().subtract(7, 'days').endOf("isoweek"),
                span: 'week',
                selectedPeriod: "This Week"
            },
            Amount: {
                from: null,
                to: null,
            },
            ClientId: null,
            Clients: [],
            Status: {
                Unsent: true,
                Unpaid: true,
                Paid: false
            }
        };

        function startBulk() {
            $scope.bulkMode = true;
        }

        function cancelBulk() {
            selectAll(false);
            $scope.bulkMode = false;
        }

        function submitBulk() {
            // var selected = $scope.invoices.filter(function(i) { return i.$selected; }).map(function(i) { return i.Id; });
            $http.post($config.API_ENDPOINT + 'api/invoice/bulksend', $scope.selectedRows).then(function() {
                swal('Success', 'Emails have been queued and Invoices will be emailed shortly.', 'success');
                cancelBulk();
            });
        }

        function selectAll(select) {
            angular.forEach($scope.invoices, function(i) {
                if (i.Client.BillingEmail) {
                    i.$selected = select;
                    var index = $scope.selectedRows.indexOf(i.Id);
                    if (index > -1 && !i.$selected)
                        $scope.selectedRows.splice(index, 1);
                    else if (index == -1 && i.$selected)
                        $scope.selectedRows.push(i.Id);
                }
            });
        }

        function toggleRowSelection(row) {
            row.$selected = !row.$selected;
            var index = $scope.selectedRows.indexOf(row.Id);
            if (index > -1 && !row.$selected)
                $scope.selectedRows.splice(index, 1);
            else if (index == -1 && row.$selected)
                $scope.selectedRows.push(row.Id);
        }

        $scope.$on("SIGNALR_updateInvoiceStatus", function(event, args) {
            var update = args[0];
            var found = $scope.invoices.filter(function(i) { return i.Id == update.Id })[0];
            if (found) {
                found.Status = update.Status;
            }
            $scope.$apply();
        });

        function anySelected() {
            return $scope.invoices.some(function(i) { return i.$selected; });
        }

        function allSelected() {
            return $scope.invoices.every(function(i) { return !i.Client.BillingEmail || i.$selected });
        }

        function filterInvoices() {
            setPage(1);
        }

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/management/invoicing/invoices/modals/filter.modal.partial.html',
                controller: ['$scope', 'rFilter', '$modalInstance', function($scope, rFilter, $modalInstance) {
                    $scope.filterOptions = angular.copy(rFilter);
                    // $scope.client = $scope.filterOptions.client;
                    $scope.clients = $scope.filterOptions.Clients;
                    $scope.searchClients = searchClients;
                    $scope.saveSelected = saveSelected;

                    function searchClients(searchText) {
                        if (!searchText)
                            return;
                        $scope.loadingClients = true;
                        $http.get($config.API_ENDPOINT + "api/Clients/Search", {
                            params: {
                                searchText: searchText,
                                lite: true
                            }
                        }).then(function(response) {
                            $scope.clients = [];
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i];
                                // if ($scope.filterOptions.ClientIds.indexOf(item.Id) == -1)
                                if (1 == 1)
                                    $scope.clients.push({
                                        Id: item.Id,
                                        Name: "(" + item.AccountNo + ") " + item.Name,
                                        Description: ((item.ClientType && item.ClientType.Name) ? item.ClientType.Name : ''),
                                    });
                            }
                            $scope.loadingClients = false;
                        });
                    }

                    function saveSelected(selected, filter) {
                        $scope.filterOptions[filter] = [selected];
                    }

                    setTimeout(function() {
                        $('#daterangepicker_bookings').daterangepicker({
                            locale: {
                                format: 'DD/MM/YYYY'
                            },
                            "autoApply": true,
                            "startDate": moment($scope.filterOptions.date.from).startOf('day'),
                            "endDate": moment($scope.filterOptions.date.to).endOf("day"),
                            "opens": "right",
                            "parentEl": "#time-controls",
                            ranges: {
                                'Today': [moment().startOf("day"), moment().endOf("day")],
                                'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                                'This Month': [moment().startOf('month'), moment().endOf('month')]
                            },
                            "alwaysShowCalendars": true,
                        });

                        $('#daterangepicker_bookings').on('apply.daterangepicker', function(ev, picker) {
                            $scope.filterOptions.date.selectedPeriod = picker.chosenLabel;
                            $scope.filterOptions.date.from = picker.startDate.toISOString();
                            $scope.filterOptions.date.to = picker.endDate.toISOString();
                            if ($scope.filterOptions.date.selectedPeriod == "Custom Range") {
                                $scope.filterOptions.date.selectedPeriod += " (" + moment($scope.filterOptions.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filterOptions.date.to).format('DD/MM/YYYY') + ")";
                            }
                            $scope.$apply();
                        });
                    }, 100)

                    $scope.datePickers = {
                        from: false,
                        to: false
                    }

                    $scope.openDatePicker = function($event, type) {
                        $scope.datePickers[type] = !$scope.datePickers[type];
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    $scope.confirmFilters = confirmFilters;

                    function confirmFilters() {
                        $modalInstance.close($scope.filterOptions);
                    }
                }],
                resolve: {
                    rFilter: function() {
                        return $scope.filter;
                    }
                    // ,
                    // rClients: function () {
                    //     return Model.Client
                    //         .query()
                    //         .select('Id,Name,AccountNo,ClientType/Name')
                    //         .include('ClientType')
                    //         .parseAs(function (data) {
                    //             this.Id = data.Id;
                    //             this.Name = "(" + data.AccountNo + ") " + data.Name;
                    //             this.Description = data.ClientType.Name;
                    //         })
                    //         .execute();
                    // }
                },
                size: 'lg'
            }).result.then(function(result) {
                $scope.filter = result;
            });
        }

        function openPaymentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/invoicing/invoices/modals/new-invoice/partial.html',
                controller: 'NewInvoiceInitController',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    rClients: ['Model', function(Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,AccountNo,ImageUrl,InvoicePeriod,ClientTypeId,ClientType/Name')
                            .include('ClientType')
                            .parseAs(function(item) {
                                this.Id = item.Id;
                                this.Name = item.Name;
                                this.AccountNo = item.AccountNo;
                                this.InvoicePeriod = item.InvoicePeriod;
                                this.Description = item.ClientType.Name;
                                this.ClientTypeId = item.ClientTypeId;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Name);
                            })
                            .execute();
                    }],
                }
            })

            modalInstance.result.then(function(data) {}, function() {});
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function() {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function setPage(page) {
            $scope.paging.currentPage = page;
            $scope.loading = true;
            var from = new moment($scope.filter.date.from);
            var to = new moment($scope.filter.date.to);
            var invoiceQuery = Model.Invoice.query()
                .include('Payments,Client')
                .select('Id,Reference,Client/BillingEmail,Client/Name,Client/AccountNo,Status,TotalAmount,NoOfBookings,CreationTime,DueDate')
                .filter('InvoiceType', 'eq', "'Client'")
                .skip($scope.paging.resultsPerPage * ($scope.paging.currentPage - 1))
                .top($scope.paging.resultsPerPage)
                .orderBy('DueDate');

            if ($scope.searchTerm.$.length > 0) {
                invoiceQuery.where("substringof('" + $scope.searchTerm.$ + "', Reference) or substringof('" + $scope.searchTerm.$ + "', Client/Name) or substringof('" + $scope.searchTerm.$ + "', Client/AccountNo)");
            } else {
                invoiceQuery
                    .filter('DueDate', 'ge', "datetimeoffset'" + from.format() + "'")
                    .filter('DueDate', 'le', "datetimeoffset'" + to.format() + "'");
                if ($scope.filter.ClientId)
                    invoiceQuery.filter('ClientId', '==', "guid'" + $scope.filter.ClientId + "'");

                if ($scope.filter.Amount.from) {
                    invoiceQuery.filter('TotalAmount', 'ge', $scope.filter.Amount.from)
                }
                if ($scope.filter.Amount.to) {
                    invoiceQuery.filter('TotalAmount', 'le', $scope.filter.Amount.to)
                }


                var statusFilter = '';
                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (statusFilter.length > 0) {
                                statusFilter += ' or ';
                            } else {
                                statusFilter += '(';
                            }
                            statusFilter += "Status eq '" + keys[i] + "'";
                        }
                    }
                }
                if (statusFilter.length > 0) {
                    statusFilter += ')';
                } else {
                    statusFilter = "1 eq 1";
                }
                invoiceQuery.where(statusFilter);
            }


            invoiceQuery.execute()
                .then(function(results) {
                    $scope.invoices = results;
                    if ($scope.selectedRows.length > 0) {
                        results = results.map(function(row) {
                            if ($scope.selectedRows.indexOf(row.Id) > -1) {
                                row.$selected = true;
                            }
                            return row;
                        });
                    }
                    $scope.loading = false;
                }, function(error) {
                    $scope.loading = false;
                    swal("Error", "Please try again or contact admin", "error");
                });
        }

        $scope.$watchGroup(['filter.date.from.valueOf()', 'filter.date.to.valueOf()', 'searchTerm.$', 'filter.ClientId', 'filter.Status.Unsent', 'filter.Status.Unpaid', 'filter.Status.Paid', 'filter.Amount.from', 'filter.Amount.to'], function(newValue, oldValue) {
            $scope.loading = true;
            $scope.selectedRows.length = 0;
            var from = new moment($scope.filter.date.from);
            var to = new moment($scope.filter.date.to);
            var invoiceQuery = Model.Invoice.query()
                .filter('InvoiceType', 'eq', "'Client'")
                .select('Id')
                .parseAs(function(data) {
                    this.Id = data.Id;
                });

            if ($scope.searchTerm.$.length > 0) {
                invoiceQuery.where("substringof('" + $scope.searchTerm.$ + "', Reference) or substringof('" + $scope.searchTerm.$ + "', Client/Name) or substringof('" + $scope.searchTerm.$ + "', Client/AccountNo)");
            } else {
                invoiceQuery
                    .filter('DueDate', 'ge', "datetimeoffset'" + from.format() + "'")
                    .filter('DueDate', 'le', "datetimeoffset'" + to.format() + "'");
                if ($scope.filter.ClientId)
                    invoiceQuery.filter('ClientId', '==', "guid'" + $scope.filter.ClientId + "'");

                if ($scope.filter.Amount.from) {
                    invoiceQuery.filter('TotalAmount', 'ge', $scope.filter.Amount.from)
                }
                if ($scope.filter.Amount.to) {
                    invoiceQuery.filter('TotalAmount', 'le', $scope.filter.Amount.to)
                }

                var statusFilter = '';
                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (statusFilter.length > 0) {
                                statusFilter += ' or ';
                            } else {
                                statusFilter += '(';
                            }
                            statusFilter += "Status eq '" + keys[i] + "'";
                        }
                    }
                }
                if (statusFilter.length > 0) {
                    statusFilter += ')';
                } else {
                    statusFilter = "1 eq 1";
                }
                invoiceQuery.where(statusFilter)
            }


            invoiceQuery.execute()
                .then(function(data) {
                    $scope.paging.totalResults = data.length;
                    $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                    setPage(1);
                });

        })

        $scope.viewItem = function($row) {
            $state.go('root.invoices.viewer', {
                Id: $row.Id
            });
        }
    }
}())