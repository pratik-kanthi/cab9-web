(function (angular) {
    var module = angular.module('cab9.common');
    module.controller('ClientItemCreditCardController', ClientItemCreditCardController);
    ClientItemCreditCardController.$inject = ['$scope', '$state', '$http', '$config', 'Model', '$stateParams', '$q', 'rSavedCards', 'rData', 'rPassenger', 'rClient', 'CSV'];

    function ClientItemCreditCardController($scope, $state, $http, $config, Model, $stateParams, $q, rSavedCards, rData, rPassenger, rClient, CSV) {
        $scope.showLoader = false;
        $scope.cardList = rSavedCards;

        //Keeps saved cards screen as the default card.
        $scope.view = {
            current: 'SAVED',
            switchTo: switchTo
        };

        //functions
        $scope.addCard = addCard;
        $scope.deleteCard = deleteCard;
        $scope.makeDefault = makeDefault;
        $scope.getCardTypeClass = getCardTypeClass;

        //Fuction to switch between view of saved cards and add new card
        function switchTo(view) {
            $scope.view.current = view;
        }

        //function to add card
        function addCard(card, isDefault) {
            $scope.showLoader = true;
            card.DefaultCard = isDefault;
            var exactdate = card.ExpirationMonth;
            if ($scope.cardList.some(function (i) {
                    return i.CardNumber.split(" ")[3] == card.CardNumber.split(" ")[3];
                })) {
                $scope.card.ExpirationMonth = exactdate;
                $scope.showLoader = false;
                $scope.card = null;
                swal("Error", "Card details entered already exists. Please check saved cards.", "error");
            } else {
                card.ExpirationYear = card.ExpirationMonth.split('/')[1].trim().slice(-2);
                card.ExpirationMonth = card.ExpirationMonth.split('/')[0].trim();

                card.Type = GetCardType(card.CardNumber);
                if (rClient != undefined)
                    card.ClientId = $stateParams.Id;
                else if (rPassenger != undefined)
                    card.PassengerId = $stateParams.Id;

                $http.post($config.API_ENDPOINT + 'api/Payments/addcard', card).then(function (response) {
                    swal("Success", "Card added successfully", "success");

                    if (isDefault) {
                        for (i = 0; i < $scope.cardList.length; i++)
                            $scope.cardList[i].DefaultCard = false;
                    }
                    $scope.cardList.push(response.data.Card);
                    $scope.showLoader = false
                    $scope.card = null;
                }, function (err) {
                    if (err.data != undefined && err.data.Message != undefined)
                        swal("Error", err.data.Message, "error");
                    else
                        swal("Error", "Something didn't work, please try again", "error");
                    $scope.card.ExpirationMonth = exactdate;
                    $scope.showLoader = false
                })
            }
        }

        //function to delete an existing card
        function deleteCard(cardId) {
            swal({
                title: "Confirm Delete",
                text: "Are you sure you want to delete this card?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm Delete!",
            }, function () {

                $http.delete($config.API_ENDPOINT + 'api/Payments/deletecard?cardId=' + cardId).then(function (response) {
                    swal("Success", "Card deleted successfully", "success");
                    $scope.cardList = $scope.cardList.filter(function (o) {
                        return o.Id != cardId;
                    })
                }, function (err) {
                    if (err.ExceptionMessage != undefined)
                        swal("Error", err.ExceptionMessage, "error");
                    else
                        swal("Error", "Something didn't work, please try again", "error");
                })
            });
        }

        //function to make existing card as an delete card
        function makeDefault(card) {
            swal({
                title: "Are you sure?",
                text: "Are you sure you want to make this card as default card?",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm!",
            }, function () {

                $http.patch($config.API_ENDPOINT + 'api/Payments/makedefault', card).then(function (response) {
                    swal("Success", "Card made as your default card successfully", "success");
                    for (i = 0; i < $scope.cardList.length; i++) {
                        if ($scope.cardList[i].Id == card.Id)
                            $scope.cardList[i].DefaultCard = true;
                        else
                            $scope.cardList[i].DefaultCard = false;
                    }
                }, function (err) {
                    swal("Error", "Something didn't work, please try again", "error");
                })
            });
        }

        //get type of card by card number
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

        //get css class to be applied on the card on the basis of card type. (Unknown cards have blank css.)
        function getCardTypeClass(Type) {
            var type = Type.toLowerCase().replace(/\s/g, "");

            if (type == "mastercard") return 'jp-card jp-card-identified jp-card-mastercard';
            else if (type == "visa")
                return 'jp-card jp-card-identified jp-card-visa';
            else if (type == "visaelectron")
                return 'jp-card jp-card-identified jp-card-visaelectron';
            else if (type == "discover")
                return 'jp-card jp-card-identified jp-card-discover';
            else if (type == "amex")
                return 'jp-card jp-card-identified jp-card-amex';
            else if (type == "diners" || type == "diners-carteblanche")
                return 'jp-card jp-card-identified jp-card-dinersclub';
            else if (type == "jcb")
                return 'jp-card jp-card-identified jp-card-jcb';
            else if (type == "elo")
                return 'jp-card jp-card-identified jp-card-elo';
            else if (type == "maestro")
                return 'jp-card jp-card-identified jp-card-maestro';
            else
                return 'jp-card jp-card-identified';
        }
    }
})(angular)