export default (argv, keys) => argv.reduce((res, arg) => {
    const ix = keys.findIndex(k => arg.startsWith(k));
    if(ix > -1) {
        res[keys[ix]] = arg === keys[ix] ? true : arg.split('=')[1].trim();
    }
    return res;
}, {});