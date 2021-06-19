(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('GoogleMapsConfigController', googleMapsConfigController);

    googleMapsConfigController.$inject = ['$scope', '$http', 'rIntegration', 'Model', '$rootScope'];

    function googleMapsConfigController($scope, $http, rIntegration, Model, $rootScope) {
        $scope.savingDetails = false;
        $scope.googleMapsDetails = new Model.GoogleMapsConfig(rIntegration[0]);
        if ($scope.googleMapsDetails == null) {
            $scope.googleMapsDetails = new Model.GoogleMapsConfig();
        }
        $scope.saveDetails = saveDetails;
        function saveDetails() {
            $scope.savingDetails = true;
            if ($scope.googleMapsDetails.Id) {
                swal({
                    title: "Are you sure?",
                    text: "Are you sure you want to update your Google map keys?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Confirm",
                    closeOnConfirm: false
                }, function() {
                    $scope.googleMapsDetails.$patch().success(function() {
                        $scope.savingDetails = false;
                        swal('Details Saved', 'Your keys have been updated to the database.', 'success');
                    });
                })
            } else {
                $scope.telephonyData.$save().success(function() {
                    $scope.savingDetails = false;
                    swal('Details Saved', 'Your keys have been saved to the database.', 'success');
                });
            }      
        } 
        $scope.instructionsObj = {
            heading: 'Google Maps Setup Instructions',
            subHeading: 'Please follow these simple instructions to setup your google maps API keys, this will allow for our mapping system to use googles machines to process our mapping related requests',
            instructions: [
                {
                    src: '/includes/images/gm-step1.png',
                    desc: 'Log into Google',
                    cap: "If you already have an google account for your business, awesome. Move to Step 9!<br />If you have a personal account, please don’t use this.<br />We need to create an account for your business. <br />Go to <a href='https://console.developers.google.com'>https://console.developers.google.com</a><br />And select ‘Create Account’."
                },
                {
                    src: '/includes/images/gm-step2.png',
                    desc: 'Create an account',
                    cap: "Create an account to manage your business."
                },
                {
                    
                    src: '/includes/images/gm-step3.png',
                    desc: 'Account Details',
                    cap: "Enter your details and Click Next."
                },
                {
                    
                    src: '/includes/images/gm-step4.png',
                    desc: 'Verification',
                    cap: "You may be asked to verify your number, enter your details and click next."
                },
                {
                    
                    src: '/includes/images/gm-step5.png',
                    desc: 'Enter Code',
                    cap: "Enter the code sent by text to your phone and click next."
                },
                {
                    
                    src: '/includes/images/gm-step6.png',
                    desc: 'More details',
                    cap: "Enter the recovery email address as shown, so we are notified of any issues with your API Keys. Then your date of birth and gender. (This is required by google for their statistics) and click NEXT."
                },
                {
                    
                    src: '/includes/images/gm-step7.png',
                    desc: 'Proceed',
                    cap: "Skip the next page.  "
                },
                {
                    
                    src: '/includes/images/gm-step8.png',
                    desc: 'Create your account',
                    cap: "And select ‘create your account’."
                },
                {
                    
                    src: '/includes/images/gm-step9.png',
                    desc: 'Terms and Conditions acceptance',
                    cap: "Agree the terms and conditions’."
                },
                {
                    
                    src: '/includes/images/gm-step10.png',
                    desc: 'Creating a project',
                    cap: "Now, to ‘create a project’. Select the top right ‘create a project’."
                },
                {
                    
                    src: '/includes/images/gm-step11.png',
                    desc: 'Naming your project',
                    cap: "Give your new project the name “cab9” and select ‘create’."
                },
                {
                    
                    src: '/includes/images/gm-step12.png',
                    desc: 'Enable APIs',
                    cap: "Now you must enable APIs and services. So click on the API library."
                },
                {
                    
                    src: '/includes/images/gm-step13.png',
                    desc: 'Select mapping APIs',
                    cap: "You are now presented with the range of Google APIs available. We only need those to do with mapping, so in the search box type MAP."
                },
                {
                    
                    src: '/includes/images/gm-step14.png',
                    desc: 'Select APIs',
                    cap: "You will. Now have a page of just the mapping APIs. So select the top one"
                },
                {
                    
                    src: '/includes/images/gm-step15.png',
                    desc: 'Activating more APIs',
                    cap: "This will then enable that API. And move it into the activate API section of the screen.<br /><br />You will need to activate the following API by clicking on them in the list beneath.<br /><br />Maps SDK for Android<br />Maps SDK for iOS<br />Maps Javascript API<br />Maps Static API<br />Roads API<br />Geocoding API<br />Distance Matrix API<br />Directions API<br />Places SDK for iOS<br />Places SDK for Android<br />Places API<br /><br />You can activate more, no harm will come. But these are the ones we currently use."
                },
                {         
                    src: '/includes/images/gm-step16.png',
                    desc: 'Select Credentials',
                    cap: "When you have completed activation, click into any of the selected APIs and you will be presented with this. Click ‘Credentials’."
                },
                {    
                    src: '/includes/images/gm-step17.png',
                    desc: 'Credentials',
                    cap: "And then, on the window, click ‘create credentials’."
                },
                {    
                    src: '/includes/images/gm-step18.png',
                    desc: 'API key generation',
                    cap: "Then select the first option ‘API Key’."
                },
                {    
                    src: '/includes/images/gm-step19.png',
                    desc: 'Copy API key',
                    cap: "This will create an API key for you. Select ‘copy’ to copy to your computer clipboard."
                },
                {    
                    src: '/includes/images/gm-step20.png',
                    desc: 'Repeat these steps',
                    cap: "Paste the key into the matching API name in your Cab9 system. Repeat this for the keys required : <br /><br />Android API KEY<br />Server KEY<br />Broswer KEY<br />IOS API KEY"
                },
                {    
                    src: '/includes/images/gm-step21.png',
                    desc: 'Account Activation',
                    cap: "Now to activate your google account click activate in the top right hand of your screen."
                },
                {    
                    src: '/includes/images/gm-step22.png',
                    desc: 'Terms & Conditions',
                    cap: "Accept the terms of service."
                },
                {    
                    src: '/includes/images/gm-step23.png',
                    desc: 'Start your free trial',
                    cap: "Select start my free trial and you have completed your google API key set up."
                }
            ]
        }
        
    }

}(angular));