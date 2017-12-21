import Config from './configuration';
import Model from './model';
import colorize from './util/colorize';
import patchExtends from './custom-extend';
patchExtends()

class RequestError extends Error {
  url: string
  options: RequestInit
  originalError: Error

  constructor(message: string, url: string, options: RequestInit, originalError: Error) {
    super(message)
    this.url = url
    this.options = options
    this.originalError = originalError
  }
}

class ResponseError extends Error {
  response: Response
  originalError: Error

  constructor(response: Response | null, message?: string, originalError?: Error) {
    super(message || 'Invalid Response')
    this.response = response
    this.originalError = originalError
  }
}

export default class Request {
  modelClass: typeof Model

  constructor(modelClass: typeof Model) {
    this.modelClass = modelClass
  }

  get(url : string, options: RequestInit) : Promise<any> {
    options.method = 'GET';
    return this._fetchWithLogging(url, options);
  }

  post(url: string, payload: Object, options: RequestInit) : Promise<any> {
    options.method = 'POST';
    options.body   = JSON.stringify(payload);

    return this._fetchWithLogging(url, options);
  }

  put(url: string, payload: Object, options: RequestInit) : Promise<any> {
    options.method = 'PUT';
    options.body   = JSON.stringify(payload);

    return this._fetchWithLogging(url, options);
  }

  delete(url: string, options: RequestInit) : Promise<any> {
    options.method = 'DELETE';
    return this._fetchWithLogging(url, options);
  }

  // private

  private _logRequest(verb: string, url: string) : void {
    Config.logger.info(colorize('cyan', `${verb}: `) + colorize('magenta', url));
  }

  private _logResponse(responseJSON : string) : void {
    Config.logger.debug(colorize('bold', JSON.stringify(responseJSON, null, 4)));
  }

  private _fetchWithLogging(url: string, options: RequestInit) : Promise<any> {
    this._logRequest(options.method, url);
    let promise = this._fetch(url, options);
    return promise.then((response : any) => {
      this._logResponse(response['jsonPayload']);
      return response
    });
  }

  private _fetch(url: string, options: RequestInit) : Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        this.modelClass.beforeFetch(url, options)
      } catch(e) {
        reject(new RequestError('beforeFetch failed; review Config.beforeFetch', url, options, e))
      }

      let fetchPromise = fetch(url, options);
      fetchPromise.then((response) => {
        this._handleResponse(response, resolve, reject)
      });

      fetchPromise.catch((e) => {
        // Fetch itself failed (usually network error)
        reject(new ResponseError(null, e.message, e))
      })
    });
  }

  private _handleResponse(response: Response, resolve: Function, reject: Function) : void {
    response.json().then((json) => {
      try {
        this.modelClass.afterFetch(response, json)
      } catch(e) {
        // afterFetch middleware failed
        reject(new ResponseError(response, 'afterFetch failed; review Config.afterFetch', e))
      }

      if (response.status >= 500) {
        reject(new ResponseError(response, 'Server Error'))
      } else if (response.status !== 422 && json['data'] === undefined) {
        // Bad JSON, for instance an errors payload
        // Allow 422 since we specially handle validation errors
        reject(new ResponseError(response, 'invalid json'))
      }

      response['jsonPayload'] = json;
      resolve(response);
    }).catch((e) => {
      // The response was probably not in JSON format
      reject(new ResponseError(response, 'invalid json', e))
    });
  }
}
