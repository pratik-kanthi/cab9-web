(function(window, angular) {
    var app = angular.module("cab9.common");
    app.directive('promiseShadow', ['$timeout', '$rootScope',
        function($timeout, $rootScope) {
            return {
                scope: {
                    promise: '='
                },
                link: function(scope, element, attrs) {
                    var longWaitTimeout = null;
                    element.css('position', 'relative');
                    element.append('<div class="shadow"><img src="/includes/images/preloader.gif" /><div class="shadow-text">Loading ...</div></div>');
                    var shadowDiv = element.find('.shadow');
                    var shadowText = element.find('.shadow-text');
                    var msgs = [
                        'Loading ...',
                        'Fetching Data ...',
                        'Just a Little Longer ...'
                    ];
                    var timeouts = [
                        1000,
                        3000,
                        10000
                    ];
                    msgs.counter = 0;

                    scope.$watch('promise', function(newvalue, oldvalue) {
                        if (newvalue) {
                            onLoading();
                            scope.promise.then(function(result) {
                                onReady();
                            }, function(error) {
                                onError(error);
                            }, function(update) {
                                onUpdate(update);
                            });
                        }
                    });

                    function onLoading() {
                        //element.slideUp();
                        $rootScope.$broadcast("Data Loading");
                        $timeout(function() {
                            shadowDiv.show();
                            msgs.counter = 0;
                            shadowText.text('Loading...').show();
                            element.addClass('still-loading');
                            element.find('.shadow img').attr('src', '/includes/images/preloader.gif');
                            startTimeout();
                        }, 0);
                    }

                    function onReady() {
                        //element.slideDown();
                        $rootScope.$emit("Data Loaded");
                        cancelTimeout();
                        shadowDiv.hide();
                        shadowText.hide();
                        element.removeClass('still-loading');
                    }

                    function onError(error) {
                        $rootScope.$emit("Data Loaded");
                        //element.slideUp();
                        element.find('.shadow img').attr('src', 'includes/images/exclaim.png');
                        console.log(error);
                        cancelTimeout();
                        shadowDiv.show();
                        element.removeClass('still-loading');
                        shadowText.text(error).show();
                    }

                    function onUpdate(update) {
                        cancelTimeout();
                        shadowDiv.show();
                        element.removeClass('still-loading');
                        shadowText.text(update).show();
                    }

                    function cancelTimeout() {
                        if (longWaitTimeout) {
                            $timeout.cancel(longWaitTimeout);
                            longWaitTimeout = null;
                        }
                    }

                    function startTimeout() {
                        longWaitTimeout = $timeout(function() {
                            if (scope.promise.$$state.status == 0) {
                                shadowText.text(msgs[msgs.counter]);
                                if (msgs.counter < (msgs.length - 1)) {
                                    msgs.counter++;
                                    startTimeout();
                                }
                            }

                        }, timeouts[msgs.counter]);
                    }
                }
            };
        }
    ]);
})(window, angular);
