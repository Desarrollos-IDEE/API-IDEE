import { getValue } from './i18n/language';

export const handlerErrorPluginWindowSync = (err, name) => {
  if (err.message.includes('Converting circular structure to JSON')) {
    if (name === 'Timeline' || name === 'BackImgLayer') {
      M.toast.error(`${getValue('exception.errorPlugin')} ${name} - ${getValue('exception.errorObjectLayer')}`, null, 6000);
    } else if (name) {
      M.toast.error(`${getValue('exception.errorPlugin')} ${name}`, null, 6000);
    } else {
      M.toast.error(getValue('exception.errorPlugin'), null, 6000);
    }

    // eslint-disable-next-line no-console
    console.error('Converting circular structure to JSON');
  }
};

export const handlerErrorURLWindowSync = (style, script, name) => {
  if (!style && name) {
    M.toast.error(`${getValue('exception.errorLinkUrl')} ${name}`, null, 6000);
    // eslint-disable-next-line no-console
    console.error(`${getValue('exception.errorLinkUrl')} ${name}`);
  }

  if (!script && name) {
    M.toast.error(`${getValue('exception.errorScriptUrl')} ${name}`, null, 6000);
    // eslint-disable-next-line no-console
    console.error(`${getValue('exception.errorScriptUrl')} ${name}`);
  }

  if (!name && !script && !style) {
    M.toast.error(getValue('exception.errorScriptOrLinkUrl'), null, 6000);
    // eslint-disable-next-line no-console
    console.error(getValue('exception.errorScriptOrLinkUrl'));
  }
};

export const handlerErrorTileLoadFunction = ({ name }) => {
  if (name) {
    M.toast.error(`${name} ${getValue('exception.errorURL')}`, null, 6000);
  } else {
    M.toast.error(getValue('exception.errorUrlMBTiles'), null, 6000);
  }
};

export const handlerErrorGenericLayer = () => {
  M.toast.error(getValue('exception.errorGeneric'), null, 6000);
};
