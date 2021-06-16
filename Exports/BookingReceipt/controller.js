(function(window, angular) {
    var app = angular.module("cab9.export");

    app.controller('BookingReceiptController', bookingReceiptController);

    bookingReceiptController.$inject = ['$scope', '$http', '$location', '$config'];

    function bookingReceiptController($scope, $http, $location, $config) {
        $scope.token = $location.search().token;
        //var token = "x8EphdpZIvqsy66YGEkBsgbzpmVZMsrbWNxGYqqtvMcxV06nBsQqX1FISbUV0c2feZwxBj94xXcfAVqu1-Y604GgNqxosC54ECMlBcYjw3btlOzIcGZB9Ad0yKJvHeKKEnC_OgL8uyPw1NR1ZfeiCg6FARaZV0H-83wAgkHBMu4CbEHxKysEeRjWlGm3emTxsSVGeK-F0jHlZd0C0MHk5zQ1VUiOYOQgzlNPitG1pouY1eGtWtSmlOyzaViMvk1lnH2DaEh1AwFRaPOF6qyz6xvxnbhNrUkK8r0pGzghrMHCDYyFHQyYV8q5FQTFlhue_4OPhRbNlcvtm0EGEyK9N4Fs4Y2DYORzcYlMJqoT1HzGjcaRw-G5fLQ3ARB3Sc-U8KyDfKrd1d-R241WJVER1_JQDIOfLYWbkDx7qxifqSFa-mH51lta3e7lS1ykGOdBb83YcKhM6AfTxFw3z47f9Ut-b8_5qAWm4sLsbFBHXf18siOW5ZuqH5LJun9U8S05rLkFw6J0AY3RQ5kAiKfpVUDV8lINc7r-gOyotjEGU-_NW4WeETDX7V818ewjx_IMmw0zoEUvY8a4Of1W8z670DlvjzKS4Ph8K8VPRH19wXA";
       	$scope.bookingId = $location.search().bookingid;
        //var bookingId = "4fea0a45-9f79-e511-80d6-d43d7e1d5603";
        $scope.API_ENDPOINT = $config.API_ENDPOINT;
        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + "api/companies",
            headers: {
                Authorization: "Bearer " + $scope.token
            }
        }).success(function(data) {
            $scope.company = data[0];
        });

        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + "api/receipt?bookingid=" + $scope.bookingId,
            headers: {
                Authorization: "Bearer " + $scope.token
            }
        }).success(function(data) {
            $scope.booking = data.Booking;
            $scope.booking.FormattedDate = data.FormattedDate;
            $scope.booking.FormattedTime = data.FormattedTime;
            $scope.booking.Currency = data.CurrencySymbol;
        });

        $scope.getAddressSummary = getAddressSummary;

        function getAddressSummary(address) {
            if (address) {
                var add = '';
                if (address.Address1) {
                    add += address.Address1;
                }
                if (address.TownCity) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.TownCity;
                } else if (address.Area) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.Area;
                }
                if (address.County && add.length == 0) {
                    add += address.County;
                }
                if (address.Postcode) {
                    if (add.length > 0) {
                        add += ', ';
                    }
                    add += address.Postcode;
                }
                return add;
            }
        }

        $scope.getImageUrl = getImageUrl;

        function getImageUrl(url, name) {
            if (url) {
                if (url.slice(0, 4) == 'http') {
                    return url;
                } else {
                    return $config.API_ENDPOINT + url;
                }
            } else {
                if (name) {
                    return $config.API_ENDPOINT + 'api/imagegen?text=' + name[0];
                }
            }
        }

    }

})(window, angular);
