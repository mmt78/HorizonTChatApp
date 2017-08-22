angular.module('starter.services', [])
    .value('AuthHeader', 'Basic QUFSTlFhZzNoanM0NVQ2Rjd1MXJsdnlSY20yRTE5TFhWUm5TQ21SSzpuU0NtUktsdnlSY0UxOUxYVkFBUk5RQ0E2REQxMjk3M0QyQ1hxN3c3cldGY3g1NkFKTWhOUlBQbXEyUTM1dzg1eFZnWUtTakU2OE1VQ3U1VDZGN3UxclJtMkYyNEFGQzMxczM1Z2pzODE5NDRuMjNIMzYxNUl6N0lZNWkwUk02SQ==')
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('HttpAuthInterceptor');
    })
    .factory('HttpAuthInterceptor', function ($injector, AppConfig, AppStorage, $q) {

        return {
            'request': function (config) {

                var token = AppStorage.get('token');

                if (token && config.url.indexOf(AppConfig.apiUrl) != -1) {
                    if (config.url.indexOf('?') == -1) {
                        config.url += '?';
                    }
                    config.url += '&access_token=' + token;
                }

                return config || $q.when(config);
            },

            'responseError': function (rejection) {
                // FORBIDDEN
                if (rejection.status == 403) {

                    AppStorage.remove('token');
                    var ionicHistory = $injector.get('$ionicHistory');
                    var stateService = $injector.get('$state');

                    ionicHistory.clearCache().then(function () {
                        stateService.go('login');
                    });
                }

                // NO CONNECTION
                if (rejection.status == 0 || rejection.status == -1) {

                    var ionicPopup = $injector.get('$ionicPopup');
                    var filter = $injector.get('$filter');

                    ionicPopup.alert({
                        title: filter('translate')('CONNECTION_ERROR'),
                        template: filter('translate')('CONNECTION_ERROR_MSG')
                    });
                }

                return $q.reject(rejection);
            }
        }
    })
    .factory('AuthService', function ($http, $q, AppConfig, AppStorage, AuthHeader) {
        var obj = {};
        obj.login = function (username, password, token, type) {
            if(type === 'user') {
                var headers = {
                    'Authorization': AuthHeader
                };
                return $http.post(AppConfig.apiUrl + '/o/token/?grant_type=password&username=' + username + '&password='+ password, {}, {headers: headers});
            } else if(type === 'driver') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/login/?username=' + username + '&password=' + password + '&token=' + token);
            }

//            return $http.post(AppConfig.apiUrl + '/driver_mobile_online/login/?username=' + username + '&password=' + password + '&token=' + AppToken.token,
//                    {}, {headers: headers});

        },
        obj.logout = function(token) {
            AppStorage.clear();
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/logout/?token=' + token);
        },
        obj.setToken = function(token) {
            AppStorage.set('token', token);
            return true;
        },
        obj.savePushToken = function(access_token, pushToken) {
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/save_user_token/?access_token=' + access_token + '&token=' + pushToken);
        },
        obj.getToken = function() {
            var token = AppStorage.get('token');
            return token ? token : false;
        },
        obj.removeToken = function() {
            AppStorage.remove('token');
            return true;
        },
        obj.isAuthenticated = function() {
            var token = AppStorage.get('token');
            return token === null ? false : true;
        };
        return obj;
    })
    .factory('Socket', function($q, $rootScope, socketFactory, $timeout) {
        var socket = $q.defer();
        $rootScope.$on('authenticated', function() {
            $timeout(function() {
                console.log('authenticated');
                var SocketUrl;
                // SocketUrl = "https://ionic-chat-mmtopcu.c9users.io";
                SocketUrl = "https://profi-ortung.de:8080/";
                //SocketUrl = "http://192.168.5.140:8080";
                //SocketUrl = "http://localhost:8080/";
                var newSocket = (function() {
                    return socketFactory({
                        // ioSocket : io.connect('https://ionic-chat-mmtopcu.c9users.io', {'forceNew': true })
                        //ioSocket : io.connect('http://93.93.252.174:8080/')
                        ioSocket : io.connect(SocketUrl)
                    });
            })();
            console.log(angular.toJson(newSocket));
            socket.resolve(newSocket);
            });
        });
        return socket.promise;
    })
    // .factory('Socket', function ($rootScope) {
    // .factory('Socket', function (socketFactory) {
        // var myIoSocket = io.connect('https://ionic-chat-mmtopcu.c9users.io');
        // var myIoSocket = io.connect('http://93.93.252.174:8080/');
        // mySocket = socketFactory({
        //     ioSocket: myIoSocket
        // });
        // return mySocket;
        // var socket;
        // $rootScope.$on('authenticated', function() {
        //     console.log('Socket rootScope');
        //     socket = io.connect('https://ionic-chat-mmtopcu.c9users.io');
        //     // var socket = io.connect('http://93.93.252.174:8080/');
        //     return {
        //         on: function (eventName, callback) {
        //             socket.on(eventName, function () {  
        //                 var args = arguments;
        //                 $rootScope.$apply(function () {
        //                     callback.apply(socket, args);
        //                 });
        //             });
        //         },
        //         emit: function (eventName, data, callback) {
        //             socket.emit(eventName, data, function () {
        //                 var args = arguments;
        //                 $rootScope.$apply(function () {
        //                     if (callback) {
        //                         callback.apply(socket, args);
        //                     }
        //                 });
        //             })
        //         }
        //     };
        // });
    // })
    .factory('UserService', function (AppConfig, AppStorage, $http) {
        var obj = {};
        var user_data = {};
        var user_drivers_data = {};
        var driver_data = {};
        var driver_user_data = {};
        var driver_drivers_data = {};
        var user_settings = {};

        var defaultSettings = {
            language: 'de'
        }
        obj.getUserSettings = function () {
            user_settings = AppStorage.get('userSettings'); 
            return user_settings ? user_settings : defaultSettings;
        },
        obj.getUserSetting = function(key) {
            user_settings = AppStorage.get('userSettings');
            if (user_settings != 'undefined') {
                return defaultSettings[key];                
            } else {
                return user_settings[key];
            } 
        },
        obj.setUserSetting = function (key, value) {        
            if (!user_settings != 'undefined') {
                defaultSettings[key] = value;
                AppStorage.set('userSettings', defaultSettings);
            } else {
                user_settings[key] = value;
                console.log(user_settings[key]);
                AppStorage.set('userSettings', user_settings);
            }
        }
        obj.saveUserData = function(user) {
            user_data = user;
        },
        obj.getUserData = function() {
            return user_data;
        },
        obj.saveUserDriversData = function(drivers) {
            user_drivers_data = drivers;
        },
        obj.getUserDriversData = function() {
            return user_drivers_data;
        },
        obj.saveDriverData = function(driver) {
            driver_data = driver;
        },
        obj.getDriverData = function() {
            return driver_data;
        },
        obj.saveDriverUserData = function(user) {
            driver_user_data = user;
        },
        obj.getDriverUserData = function() {
            return driver_user_data;
        },
        obj.saveDriverDriversData = function(drivers) {
            driver_drivers_data = drivers;
        },
        obj.getDriverDriversData = function() {
            return driver_drivers_data;
        },
        obj.uploadProfilePic = function(type, token, image) {
            if(type === 'user') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/upload_user_image/?access_token=' + token + '&image=' + image);
            } else if(type === 'driver') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/upload_driver_image/?token=' + token + '&image=' + image);
            }
        },
        obj.getUserPreference = function(token) {
            return $http.get(AppConfig.apiUrl + '/user_preferences/?access_token=' + token);
        },
        obj.getDriversList = function(token, type) {
            if(type === 'user') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/user_drivers/?access_token=' + token);
            } else if(type === 'driver') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/drivers/?token=' + token);
            }
        },
        obj.getVehicleIcons = function(token, type) {
            if(type == 'driver') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/devices/?token=' + token);
            } else if (type == 'user') {
                return $http.get(AppConfig.apiUrl + '/driver_mobile_online/user_devices/?access_token=' + token);
            }
        },
        obj.setTripType = function(tripData) {
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/driver_device_update/?token=' + tripData.token + '&device_id=' + tripData.device_id + '&trip_typ=' + tripData.trip_type);
        },
        obj.hideShowDevice = function(device_id) {
            return $http.get(AppConfig.apiUrl + '/hide_devices/'+ device_id +'/update/');
        },
        obj.getUserInformation = function (token) {
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/user_info/?access_token=' + token);
        },
        obj.getDriverInformation = function (token) {
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/get_driver_info/?token=' + token);
        },
        obj.getPushToken = function(user_id, user_type) {
            console.log(user_id, user_type);
            return $http.get(AppConfig.apiUrl + '/driver_mobile_online/get_token/?user_id=' + user_id + '&user_type=' + user_type);
        },
        /**
         * Dil seçimini günceller.
         * @author feyyaz
         */
        obj.updateLanguage = function (langKey) {

            //var langKeyNumber = this.getUserLangKeyNumber(langKey);
            var device_token = NotificationService.getDeviceToken();

            return $http.get(AppConfig.apiUrl + '/mobile_online/update_language/?device_token=' +
                    device_token + '&language=' + langKey);
        },
        obj.updateTimezone = function (timezone) {

            return $http.get(AppConfig.apiUrl + '/user_information/timezone/update?timezone=' + timezone);
        },

        /**
         * Parametre olarak gönderilen dilin veritabanındaki numarasını getirir.
         * @params langKey (de,en,tr,ar,nl)
         * @author feyyaz
         */
        obj.getUserLangKeyNumber = function (langKey) {
            switch (langKey) {
                case 'de': // 0
                    return 0;
                    break;
                case 'en': // 1
                    return 1;
                    break;
                case 'tr': // 2
                    return 2;
                    break;
                case 'ar': // 3
                    return 3;
                    break;
                case 'nl': // 4
                    return 4;
                    break;
            }
        },
        /**
         * Parametre olarak gönderilen dil numarasına ait dili getirir.
         * @params langKey (0,1,2,3,4)
         * @author feyyaz
         */
        obj.getUserLangKey = function (langKeyNumber) {
            switch (langKeyNumber) {
                case 0: // de
                    return 'de';
                    break;
                case 1: // en
                    return 'en';
                    break;
                case 2: // tr
                    return 'tr';
                    break;
                case 3: // ar
                    return 'ar';
                    break;
                case 4: // nl
                    return 'nl';
                    break;
            }
        };
        return obj;
    })
    .factory('MessageService', function ($http, AppConfig, AuthHeader) {
        var obj = {};
        var msgs = [];
        obj.saveMsgs = function(msg) {
            var data = {
                reply       :   msg.message,
                from_id     :   msg.senderId,
                to_id       :   msg.receiverId,
                timestamp   :   msg.timestamp,
                con_id      :   msg.messageType
            }
            return $http.get(AppConfig.apiUrl + '/conversation_reply/insertMessage/?from_id=' + msg.senderId + '&to_id=' + 
                            msg.receiverId + '&reply=' + msg.message + '&timestamp=' + msg.timestamp + '&con_id=' + msg.messageType);
        },
        obj.getMsgs = function(query) {
            var data = {
                from_id     :   query.senderId,
                to_id       :   query.receiverId,
            }
            return $http.get(AppConfig.apiUrl + '/conversation_reply/getMessages/' + data.from_id + '/' + data.to_id);
        },
        obj.readMsg = function(id, is_read, read_time) {
            return $http.get(AppConfig.apiUrl + '/conversation_reply/update/' + id + '/?is_read=' + is_read + '&read_time=' + read_time);
        },
        obj.isMsgs = function() {
            return msgs.length > 0;
        };
        return obj;
    });


