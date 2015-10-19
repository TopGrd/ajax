/* 
* @Author: Li'Zhuo
* Think First, Code Later
* @Date:   2015-10-07 19:30:43
* @Last Modified time: 2015-10-19 18:08:12
* @Email: topgrd@outlook.com
*/

(function () {

	window.ajax = function (options) {
		var _default = {
			async: true,
			cache: false
		};
		options = extend(_default, options);

		var _obj = {
			xhr: createXhr(),
			successCallbacks: [],
			errorCallbacks: [],
			alwaysCallbacks: [],
			options: options
		}; 

		function createXhr() {
			var xhr = false;
			try {
				xhr = new ActiveXObject('Msxml2.XMLHTTP');
			}
			catch (e) {
				try {
					xhr = new ActiveXObject('Microsoft.XMLHTTP');
				}
				catch (e2) {
					xhr = false;
				}
			}
			if (!xhr && typeof XMLHttpRequest != 'undefined') {
				xhr = new XMLHttpRequest();
			}

			return xhr;
		}
		
		/**
		 *
		 * 设置前置处理方法a
		 * @param {Function} callback
		 */
		
		_obj.before = function (callback) {
			typeof(callback) === 'function' && callback(_obj.xhr);
			return _obj; /* 支持链式操作 */
			
		};

		/**
		 * 设置请求头
		 * 
		 * 此方法必须在post|get 之前执行
		 */
		
		_obj.header = function (name, value) {
			_obj.xhr.setRequestHeader(name, value);
			return _obj;
		};

		_obj.headers = function (headers) {
			if (Object.prototype.toString.call(headers) === '[object object]') {
				for (var name in headers) {
					_obj.xhr.setRequestHeader(name, headers[name]);
				}
			}
		};

		/**
		 *
		 * 成功后执行回调
		 * @callback 回调函数
		 * @jsonForceValidate 是否强制验证JSON
		 */
		
		_obj.success = function (callback, jsonForceValidate) {
			_obj.jsonForceValidate = jsonForceValidate;

			if (typeof(callback) === 'function') {
				_obj.successCallbacks.push(callback);
			}

			return _obj;
		};

		/**
		 *
		 * 错误后执行回调
		 * @callback 回调函数
		 */
		_obj.error = function (callback) {
			if (typeof(callback) === 'function') {
				_obj.errorCallbacks.push(callback);
			}

			return _obj;
		};

		_obj.always = function (callback) {
			if (typeof(callback) === 'function') {
				_obj.alwaysCallbacks.push(callback);
			}

			return _obj;
		};

		/**
		 *
		 * 设置超时时间并执行回调
		 * @callback 回调函数
		 */
		_obj.timeout = function (timeout, callback) {
			_obj.xhr.timeout = timeout; 
			if (typeof(callback) === 'function') {
				_obj.xhr.timeout = function () {
					callback(_obj.xhr)
				}
			}

			return _obj;
		};

		/**
		 * post请求
		 * param:
		 * @url 请求地址
		 * @data 数据
		 * @contentType 内容类型
		 */
		_obj.post = function (url, data, contentType) {
			if (typeof(url) === 'undefined') throw 'url不能为空';
			if (Object.prototype.toString.call(data) !== '[object Object]') data= undefined;
			if (typeof(contentType) !== 'string') contentType = 'urlencoded';

			doAjax(_obj, 'post', url, data, contentType);

			return _obj;
		};

		/**
		 * get请求
		 * param:
		 * @url 请求地址
		 * @data 数据
		 */
		_obj.get = function (url, data) {
			if (typeof(url) === 'undefined') throw 'url不能为空';
			if (Object.prototype.toString.call(data) !== '[object Object]') data= undefined;

			doAjax(_obj, 'get', url, data, 'urlencoded');

			return _obj;
		}


		function doAjax(_obj, method, url, data, contentType) {
			var xhr = _obj.xhr;
			data = encodeData(data, contentType);

			if (!_obj.options.cache) {
				url += (url.indexOf('?') == -1 ? '?' : '&') + 't=' + new Date().getTime();
			}

			if ('get' === method) {
				url += (url.indexOf('?') == -1 ? '?' : '&') +data;
			}
			bindEventHandler(xhr);

			xhr.open(method, url, _obj.options.async);
			if ('post' === method && data) {
				xhr.setRequestHeader('Content-Type', _obj.postContentType);
				xhr.send(data);
			}
			else {
				xhr.send();
			}
		}

		function encodeData(data, contentType) {
			if (Object.prototype.toString.call(data) === '[object Object]') {
				if ('json' === contentType.toLowerCase()
					&& typeof(JSON) === 'object'
					&& typeof(JSON.stringify) === 'function') {

					_obj.postContentType = 'application/json';
					return JSON.stringify(data);
				}
				else {
					_obj.postContentType = 'application/x-www-form-urlencoded';
					return encodeParam(data);
				}
			}
		}

		function encodeParam(data) {
			if (Object.prototype.toString.call(data) == '[object Object]') {
				var params = [];
				for (var name in data) {
					var value = data[name];
					if (Object.prototype.toString.call(value) == '[object Array]') {
						for (var i=0;i<value.length;++i) {
							params.push(name + '=' + encodeURIComponent(value[i]));
						}
					}
					else {
						params.push(name + '=' + encodeURIComponent(data[name]));
					}
				}
			}
			return params.join('&');
		}

		function bindEventHandler(xhr) {
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) {
					var i, len;
					for (i = 0, len = _obj.alwaysCallbacks.length; i < len; i++) {
						_obj.alwaysCallbacks[i](xhr.status, xhr.responseText, xhr);
					}

					var resText = xhr.responseText;
					var resJson = toJson(resText);

					if (xhr.status == 200) {
						if (_obj.jsonForceValidate && typeof(resJson) === 'undefined') {
							for (i=0, len = _obj.errorCallbacks.length;i<len; i++) {
								_obj.errorCallbacks[i](xhr.status, xhr.responseText, xhr);
							}
						}
						else {
							for (i=0, len = _obj.successCallbacks.length;i<len; i++) {
								_obj.successCallbacks[i](resJson || resText, xhr);
							}
						}
					}
					else {
						for (i=0, len = _obj.errorCallbacks.length;i<len; i++) {
							_obj.errorCallbacks[i](xhr.status, xhr.responseText, xhr)
						}
					}
				}
			}
		}

		return _obj;
	
	};



	function toJson(text) {
		var json;
		try {
			if (typeof(JSON) === 'object' && typeof(JSON.parse) === 'function') {
				json = JSON.parse(text);
			}
			else {
				json = eval(text);
			}
		}
		catch (e) {

		}
		return json;
	}


	function extend(obj1, obj2) {
		if (Object.prototype.toString.call(obj1) === '[object Object]' && Object.prototype.toString.call(obj2) === '[object Object]') {
			for (var name in obj2) {
				obj1[name] = obj2[name];
			};
		}
		return obj1;
	}

})();