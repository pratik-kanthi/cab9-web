(function (angular) {
    var module = angular.module('cab9.clients');
    module.controller('ClientInviteToAppController', ClientInviteToAppController);

    ClientInviteToAppController.$inject = ['$scope', '$stateParams', '$modal', '$http', '$config', 'Auth', 'Model', '$window'];

    function ClientInviteToAppController($scope, $stateParams, $modal, $http, $config, Auth, Model, $window) {
        //Initiating start tab with the uninvited one
        $scope.tab = {
            current: 'UNINVITED'
        };
        $scope.selectedRows = [];
        var slideIndex = 1;

        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null,
            loading: true,
        };

        //Methods
        $scope.inviteSelected = inviteSelected;
        $scope.inviteAll = inviteAll;
        $scope.plusDivs = plusDivs;
        $scope.showDivs = showDivs;
        $scope.getImages = getImages;
        $scope.getUninvitedPassengers = getUninvitedPassengers;
        $scope.getInvitedPassengers = getInvitedPassengers;
        $scope.getFailedPassengers = getFailedPassengers;

        //Search Methods
        $scope.toggleSearch = toggleSearch;
        $scope.toggleRowSelection = toggleRowSelection;

        //Show Images of the customer app on right section
        //showDivs(slideIndex);
        getImages();
        getUninvitedPassengers(1);

        function getUninvitedPassengers(pageNum, searchTerm) {
            $scope.paging.loading = true;
            $scope.paging.currentPage = pageNum||1;

            $http.get($config.API_ENDPOINT + 'api/invite/passengers', {
                params: {
                    clientId: $stateParams.Id,
                    invited: false,
                    pageNumber: pageNum||1,
                    records: $scope.paging.resultsPerPage,
                    searchTerm: searchTerm || null
                }
            }).success(function(response) {
                $scope.paging.loading = false;
                $scope.paging.totalResults = response.Count;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                $scope.uninvitedPassengers = response.Passengers.map(function(x) {
                    return new Model.Passenger(x);
                });
            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });
        }

        function getInvitedPassengers(pageNum, invitedSearchTerm) {
            $scope.paging.loading = true;
            $scope.paging.currentPage = pageNum||1;

            $http.get($config.API_ENDPOINT + 'api/invite/passengers', {
                params: {
                    clientId: $stateParams.Id,
                    invited: true,
                    pageNumber: pageNum||1,
                    records: $scope.paging.resultsPerPage,
                    searchTerm: invitedSearchTerm || null
                }
            }).success(function(response) {
                $scope.paging.loading = false;
                $scope.paging.totalResults = response.Count;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                $scope.invitedPassengers = response.Passengers.map(function(x) {
                    return new Model.Passenger(x);
                });
            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });

        }

        function getFailedPassengers(pageNum, searchTerm) {
            $scope.paging.loading = true;
            $scope.paging.currentPage = pageNum||1;

            $http.get($config.API_ENDPOINT + 'api/invite/FailedPassengers', {
                params: {
                    clientId: $stateParams.Id,
                    pageNumber: pageNum||1,
                    records: $scope.paging.resultsPerPage,
                    searchTerm: searchTerm || null
                }
            }).success(function(response) {
                $scope.paging.loading = false;
                $scope.paging.totalResults = response.Count;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                $scope.failedPassengers = response.Passengers.map(function(x) {
                    return new Model.PassengerAppInvitationDetail(x);
                });
            }).error(function(error) {
                $scope.paging.loading = false;
                swal("Error", error.Message, "error");
            });

        }

        //invite selected passengers from the list
        function inviteSelected(failed) {
            //show confirm box before invitation
            swal({
                title: "Invite Selected Passengers?",
                text: "Are you sure you want to invite selected passengers?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Invite them!",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm) {
                if (isConfirm) {
                    //API call to invite selected passengers
                    $http.post($config.API_ENDPOINT + 'api/Invite/selectedPassengers?ClientId=' + $stateParams.Id, $scope.selectedRows).then(function (response) {
                        if (failed) {
                            //if this is failed rows view
                            //On success remove selected rows
                            $scope.failedPassengers = $scope.failedPassengers.filter(function (x) {
                                return $scope.selectedRows.indexOf(x.Id) < 0;
                            });
                        }
                        else if (!failed) {
                            //if this is uninvited rows view
                            //On success remove selected rows
                            $scope.uninvitedPassengers = $scope.uninvitedPassengers.filter(function (x) {
                                return $scope.selectedRows.indexOf(x.Id) < 0;
                            });
                        }
                        //empty selected row array
                        $scope.selectedRows = [];
                        //show success alert
                        swal('Invite Success', 'Invitation mail with username and password will be sent to selected passengers shortly.', 'success');
                    }, function () {
                        //show error alert
                        swal('Invite Error', 'An error occured.', 'error');
                    });
                } else {
                    //close swal on cancel
                    swal.close();
                }
            });
        }

        //invite all passengers for the client
        function inviteAll(failed) {
            //swal to confirm invitation
            swal({
                title: "Invite All Passengers?",
                text: "Are you sure you want to invite all the passengers?",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Yes, Invite them!",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm) {
                if (isConfirm) {
                    //if this is failed rows view, get IDs for all the rows in failedpassenger list
                    if (failed)
                        $scope.selectedRows = $scope.failedPassengers.map(function (a) { return a.Id; });
                    //if this is uninvited rows view, get IDs for all the rows in uninvitedpassenger list
                    else
                        $scope.selectedRows = $scope.uninvitedPassengers.map(function (a) { return a.Id; });

                    //API call to invite selected passengers
                    $http.post($config.API_ENDPOINT + 'api/Invite/selectedPassengers?ClientId=' + $stateParams.Id, $scope.selectedRows).then(function (response) {
                        
                        //empty passenger lists 
                        if (failed)
                            $scope.failedPassengers = [];
                        else if (!failed)
                            $scope.uninvitedPassengers = [];

                        //empty rows
                        $scope.selectedRows = [];

                        //swal to show success message
                        swal('Invite Success', 'Invitation mail with username and password will be sent to selected passengers shortly.', 'success');

                    }, function (err) {
                        //empty rows
                        $scope.selectedRows = [];
                        //swal to show error message
                        swal('Invite Error', 'An error occured.', 'error');
                    });

                } else {
                    //empty rows
                    //close swal
                    $scope.selectedRows = [];
                    swal.close();
                }
            });
        }

        //select and unselect the row for invitation
        function toggleRowSelection(index, pax, failed) {
            
            pax.$selected = !pax.$selected;

            //if selected is false remove the row from selected rows
            if (!pax.$selected) {
                var _index = $scope.selectedRows.indexOf(pax.Id);
                $scope.selectedRows.splice(_index, 1);
            }
            //if selected is true add to the selected rows array
            else if (pax.$selected) {
                $scope.selectedRows.push(pax.Id);
            }
        }

        //toggling search textbox
        function toggleSearch() {

            //if uninvited view show search textbox for uninvited
            if ($scope.tab.current == 'UNINVITED') {
                $scope.showSearch = !$scope.showSearch;
                if (!$scope.showSearch) {
                    $scope.searchTerm.$ = '';
                } else {
                    setTimeout(function () {
                        $('#searchTerm').focus()
                    }, 500);
                }
            }

            //if invited view show search textbox for invited
            else if ($scope.tab.current == 'INVITED') {
                $scope.showInvitedSearch = !$scope.showInvitedSearch;
                if (!$scope.showInvitedSearch) {
                    $scope.invitedSearchTerm.$ = '';
                } else {
                    setTimeout(function () {
                        $('#searchTerm').focus()
                    }, 500);
                }
            }

            //if failed view show search textbox for failed
            else if ($scope.tab.current == 'FAILED') {
                $scope.showFailedSearch = !$scope.showFailedSearch;
                if (!$scope.showFailedSearch) {
                    $scope.failedSearchTerm.$ = '';
                } else {
                    setTimeout(function () {
                        $('#searchTerm').focus()
                    }, 500);
                }
            }
        }

        //Get customer app images for tenant.
        function getImages() {
            //fetch tenantId for the customer app
            var TenantId = Auth.getSession().Claims.TenantId ? Auth.getSession().Claims.TenantId[0] : null;
            if (TenantId != null) {
                // excel
                if (TenantId.toUpperCase() == '50F56597-C049-E611-80C7-14187728D133') {
                    $scope.images = [];
                    $scope.images.first = "/includes/images/customer-app/excel/app-image-1.jpg";
                    $scope.images.second = "/includes/images/customer-app/excel/app-image-2.jpg";
                    $scope.images.third = "/includes/images/customer-app/excel/app-image-3.jpg";
                    $scope.images.fourth = "/includes/images/customer-app/excel/app-image-4.jpg";
                }
                //Sherbet
                else if (TenantId.toUpperCase() == '301FD400-A0FC-496F-A630-BCB6A6DD5BE7') {
                    $scope.images = [];
                    $scope.images.first = "/includes/images/customer-app/sherbet/app-image-1.jpg";
                    $scope.images.second = "/includes/images/customer-app/sherbet/app-image-2.jpg";
                    $scope.images.third = "/includes/images/customer-app/sherbet/app-image-3.jpg";
                    $scope.images.fourth = "/includes/images/customer-app/sherbet/app-image-4.jpg";
                }
                //jgexec
                else if (TenantId.toUpperCase() == '05d27dec-e958-44af-a255-530826ea2d9c') {
                    $scope.images = [];
                    $scope.images.first = "/includes/images/customer-app/jgexec/app-image-1.jpg";
                    $scope.images.second = "/includes/images/customer-app/jgexec/app-image-2.jpg";
                    $scope.images.third = "/includes/images/customer-app/jgexec/app-image-3.jpg";
                    $scope.images.fourth = "/includes/images/customer-app/jgexec/app-image-4.jpg";
                }
                // laplus
                else if (TenantId.toUpperCase() == '47eeb57a-b187-4661-a28e-11adceeb1398') {
                    $scope.images = [];
                    $scope.images.first = "/includes/images/customer-app/laplus/app-image-1.jpg";
                    $scope.images.second = "/includes/images/customer-app/laplus/app-image-2.jpg";
                    $scope.images.third = "/includes/images/customer-app/laplus/app-image-3.jpg";
                    $scope.images.fourth = "/includes/images/customer-app/laplus/app-image-4.jpg";
                }
                else{
                    $scope.images = [];
                    $scope.images.first = "/includes/images/customer-app/excel/app-image-1.jpg";
                    $scope.images.second = "/includes/images/customer-app/excel/app-image-2.jpg";
                    $scope.images.third = "/includes/images/customer-app/excel/app-image-3.jpg";
                    $scope.images.fourth = "/includes/images/customer-app/excel/app-image-4.jpg";
                }
            }
        }

        //Move gallery left and right
        function plusDivs(n) {
            showDivs(slideIndex += n);
        }

        //Display the image
        function showDivs(n) {
            var i;
            var x = document.getElementsByClassName("mySlides");
            if (n > x.length) { slideIndex = 1 }
            if (n < 1) { slideIndex = x.length }
            for (i = 0; i < x.length; i++) {
                x[i].style.display = "none";
            }
            x[slideIndex - 1].style.display = "block";
        }

    }
}(angular))