import { BaseTransport } from '@sentry/transport-base';
import { Transport, TransportRequest, TransportMakeRequestResponse } from '@sentry/types';

export class XHRTransport extends BaseTransport implements Transport {
  protected _makeRequest<T>(request: TransportRequest<T>): PromiseLike<TransportMakeRequestResponse> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onerror = error => reject(error);
      xhr.onreadystatechange = (): void => {
        if (xhr.readyState === 4) {
          resolve({
            body: xhr.responseText,
            headers: {
              'x-sentry-rate-limits': xhr.getResponseHeader('X-Sentry-Rate-Limits'),
              'retry-after': xhr.getResponseHeader('Retry-After'),
            },
            reason: xhr.statusText,
            statusCode: xhr.status,
          });
        }
      };

      xhr.open('POST', this._dsn.getEnvelopeEndpoint());
      // "When using setRequestHeader(), you must call it after calling open(), but before calling send()."
      // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/setRequestHeader
      for (const header in this._options.headers) {
        if (Object.prototype.hasOwnProperty.call(this._options.headers, header)) {
          xhr.setRequestHeader(header, this._options.headers[header]);
        }
      }
      const body = (request.body as unknown) as BodyInit;
      xhr.send(body);
    });
  }
}
