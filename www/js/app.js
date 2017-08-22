1// Ionic Starter App
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
var chatApp = angular.module('starter', [
    'starter.controllers',
    'starter.services',
    'ionic',
    'btford.socket-io',
    'ngAnimate',
    'ngCordova',
    'ngCordovaOauth',
    'ionic.cloud',
    'pascalprecht.translate',
    'angularMoment'
    ])
    .run(function ($ionicPlatform, $translate, $rootScope, $state, AppStorage, UserService) {
        $ionicPlatform.ready(function () {
            if (window.cordova && window.cordova.plugins.Keyboard) {
                // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
                // for form inputs)
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

                // Don't remove this line unless you know what you are doing. It stops the viewport
                // from snapping when text inputs are focused. Ionic handles this internally for
                // a much nicer keyboard experience.
                // cordova.plugins.Keyboard.disableScroll(false);
            }
            if (window.StatusBar) {
                StatusBar.styleDefault();
            }
            var platform = ionic.Platform.platform();
            var version = ionic.Platform.version();

            AppStorage.set('platform', platform);
            AppStorage.set('version', version);

            $ionicPlatform.registerBackButtonAction(function (event) {
                    if($state.current.name=="app.list"){
                        navigator.app.exitApp();
                    }
                    else {
                        navigator.app.backHistory();
                    }
                }, 100);
            });
        $translate.use(UserService.getUserSetting('language'));
        $rootScope._ = window._;
    })
    .directive('ngEnter', function () {
        return function (scope, element, attrs) {
            element.bind("keydown keypress", function (event) {
                if (event.which === 13) {
                    scope.$apply(function () {
                        scope.$eval(attrs.ngEnter);
                    });
                    event.preventDefault();
                }
            })
        }
    })
    .config(function ($stateProvider, $urlRouterProvider, $ionicCloudProvider, $translateProvider, $httpProvider, $ionicConfigProvider) {
        
        $ionicConfigProvider.backButton.previousTitleText(false);
        $ionicConfigProvider.backButton.icon('ion-chevron-left');
        $ionicConfigProvider.backButton.text('');

        $ionicCloudProvider.init({
            "core": {
                "app_id": "31ab4270"
            },
            "push": {
                "sender_id": "878124414166",
                "pluginConfig": {
                    "ios": {
                        "badge": true,
                        "sound": true
                    },
                    "android": {
                        "iconColor": "#343434"
                    }
                }
            }
        });


        $stateProvider
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginController'
            })
            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'templates/menu.html',
                controller: 'AppController'
            })
            .state('app.list', {
                url : '/list',
                // params: {data: null},
                views : {
                    'menuContent': {
                        templateUrl: 'templates/list.html',
                        controller: 'ListController'
                    }
                }
            })
            .state('app.chat', {
                url: '/chat',
                params: {data: null},
                views : {
                    'menuContent': {
                        templateUrl: 'templates/chat.html',
                        controller: 'ChatController'
                    }
                }
            })
            .state('app.settings', {
                url: '/settings',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/settings.html',
                        controller: 'SettingsController'
                    }
                }
            })
            .state('app.devices', {
                url : '/devices',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/devices.html',
                        controller: 'DevicesController'
                    }
                }
            })
            .state('app.device', {
                url : '/devices/:deviceName/:deviceId/:hideStatus/:tripType',
                // params : {device : null},
                views: {
                    'menuContent': {
                        templateUrl: 'templates/device.html',
                        controller: 'DeviceController'
                    }
                }
            })
            .state('app.language', {
                url : '/language',
                views: {
                    'menuContent': {
                        templateUrl: 'templates/language.html',
                        controller: 'LanguageController'
                    }
                }
            })
            .state('app.privacy', {
                url : '/privacy',
                views : {
                    'menuContent' : {
                        templateUrl: 'templates/privacy_policy.html',
                        controller: 'PrivacyController'
                    }
                }
            })
            ;

        $urlRouterProvider.otherwise('/login');
        $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
        /* Language settings
         */
        $translateProvider.useStaticFilesLoader({
            prefix: 'lang/',
            suffix: '.json'
        });
        $translateProvider.useSanitizeValueStrategy(null);
        //$translateProvider.preferredLanguage('en');
    })
    /* Constant Values */
    .constant('AppToken', {
        // token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhZjZjMjU5YS02OGNjLTQyMmQtYmMzZi1iYTg3MGE1YzYzOTMifQ.69UBfv_Qq3F4XrZ2YJOB-gh2EWuKdh8ImdzRkIfIY00'
        token: 'eONATZ2Mk80:APA91bGK60PjBPbOci-eePrv-IfUmKDCJJVKlilYPKoZk462nl1fvXHHciND5qA5OT9IBIU4dcEfh6f6HDbTJBhphNQWisZY-qOd79ZW8WPv9fKNR5BIRp861BAk7_B0Bb4CAZholEil999'
        
    })
    .constant('AppConfig', {
        apiUrl: 'http://93.93.252.174/api/v1'
    })
        // localStorage
    .constant('AppStorage', BoomerangCache.create('horizont'))
    .constant('_', window._);
