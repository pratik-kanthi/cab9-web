(function (angular) {
    var module = angular.module('cab9.common');
    module.controller('PaymentCardController', PaymentCardController);
    PaymentCardController.$inject = ['$scope', '$UI', '$modal', '$modalInstance', '$state', '$http', '$config', '$stateParams', '$q', 'CSV', 'rPassengerId'];

    function PaymentCardController($scope, $UI, $modal, $modalInstance, $state, $http, $config, $stateParams, $q, CSV, rPassengerId) {
        $scope.mode = 'CREATE';
        $scope.addCard = addCard;
        $scope.showLoader = false;

        //function to add card
        function addCard(card, isDefault) {
            $scope.showLoader = true;
            var exactyear = card.ExpirationMonth;
            card.ExpirationYear = card.ExpirationMonth.split('/')[1].trim().slice(-2);
            card.ExpirationMonth = card.ExpirationMonth.split('/')[0].trim();
            card.DefaultCard = isDefault;
            card.Type = GetCardType(card.CardNumber);
            card.PassengerId = rPassengerId;

            $http.post($config.API_ENDPOINT + 'api/Payments/addcard', card).then(function (response) {
                swal({
                    title: "Card Saved",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(response.data);
                $scope.showLoader = false;
            }, function (err) {
                if (err.data != undefined && err.data.Message != undefined)
                    swal("Error", err.data.Message, "error");
                else
                    swal("Error", "Something didn't work, please try again", "error");
                $scope.card.ExpirationMonth = exactyear;
                $scope.showLoader = false;
            })
        }

        //get type of card
        function GetCardType(number) {
            // visa
            var re = new RegExp("^4");
            if (number.match(re) != null)
                return "visa";

            // Mastercard 
            // Updated for Mastercard 2017 BINs expansion
            if (/^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/.test(number))
                return "mastercard";

            if ((/^(5[1-5]\d{2})[\s\-]?(\d{4})[\s\-]?(\d{4})[\s\-]?(\d{4})$/).test(number))
                return "mastercard";

            // AMEX
            re = new RegExp("^3[47]");
            if (number.match(re) != null)
                return "amex";

            // Discover
            re = new RegExp("^(6011|622(12[6-9]|1[3-9][0-9]|[2-8][0-9]{2}|9[0-1][0-9]|92[0-5]|64[4-9])|65)");
            if (number.match(re) != null)
                return "discover";

            // Diners
            re = new RegExp("^36");
            if (number.match(re) != null)
                return "diners";

            // Diners - Carte Blanche
            re = new RegExp("^30[0-5]");
            if (number.match(re) != null)
                return "diners-carteblanche";

            // JCB
            re = new RegExp("^35(2[89]|[3-8][0-9])");
            if (number.match(re) != null)
                return "jcb";

            // Visa Electron
            re = new RegExp("^(4026|417500|4508|4844|491(3|7))");
            if (number.match(re) != null)
                return "visaelectron";

            re = new RegExp("^(40117[8-9]|431274|438935|451416|457393|45763[1-2]|506(699|7[0-6][0-9]|77[0-8])|509\d{3}|504175|627780|636297|636368|65003[1-3]|6500(3[5-9]|4[0-9]|5[0-1])|6504(0[5-9]|[1-3][0-9])|650(4[8-9][0-9]|5[0-2][0-9]|53[0-8])|6505(4[1-9]|[5-8][0-9]|9[0-8])|6507(0[0-9]|1[0-8])|65072[0-7]|6509(0[1-9]|1[0-9]|20)|6516(5[2-9]|[6-7][0-9])|6550([0-1][0-9]|2[1-9]|[3-4][0-9]|5[0-8]))");
            if (number.match(re) != null)
                return "elo";

            re = new RegExp("^(5018|5020|5038|6304|6759|6761|6763)[0-9]{8,15}$");
            if (number.match(re) != null)
                return "maestro";

            return "";
        }

    }
})(angular)