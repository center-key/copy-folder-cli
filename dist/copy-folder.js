//! copy-folder-util v0.2.4 ~~ https://github.com/center-key/copy-folder-util ~~ MIT License

import fs from 'fs';
import path from 'path';
import slash from 'slash';
const extraneousFiles = ['.DS_Store', 'Thumbs.db', 'desktop.ini'];
const extraneousFolders = ['.git', 'node_modules'];
const copyFolder = {
    cp(sourceFolder, targetFolder, options) {
        const defaults = {
            basename: null,
            cd: null,
            fileExtensions: [],
        };
        const settings = Object.assign(Object.assign({}, defaults), options);
        const startTime = Date.now();
        const normalize = (folder) => !folder ? '' : slash(path.normalize(folder)).replace(/\/$/, '');
        const startFolder = settings.cd ? normalize(settings.cd) + '/' : '';
        const source = normalize(startFolder + sourceFolder);
        const target = normalize(startFolder + targetFolder);
        if (targetFolder)
            fs.mkdirSync(target, { recursive: true });
        const errorMessage = !sourceFolder ? 'Must specify the source folder path.' :
            !targetFolder ? 'Must specify the target folder path.' :
                !fs.existsSync(source) ? 'Source folder does not exist: ' + source :
                    !fs.existsSync(target) ? 'Target folder cannot be created: ' + target :
                        !fs.statSync(source).isDirectory() ? 'Source is not a folder: ' + source :
                            !fs.statSync(target).isDirectory() ? 'Target is not a folder: ' + target :
                                null;
        if (errorMessage)
            throw Error('[copy-folder-util] ' + errorMessage);
        const filterOff = {
            base: !settings.basename,
            ext: !settings.fileExtensions || settings.fileExtensions.length === 0,
        };
        const files = [];
        const posixPath = (nativePath) => slash(nativePath.replace(/.*:/, ''));
        const relativePath = (fullPath, start) => fullPath.substring(fullPath.indexOf(start) + start.length + 1);
        const filter = (origin, dest) => {
            const isFile = fs.statSync(origin).isFile();
            const name = path.basename(origin);
            const ext = path.extname(origin);
            const keepFolder = !isFile && !extraneousFolders.includes(name);
            const keepFile = isFile &&
                (filterOff.base || name.replace(/[.].*/, '') === settings.basename) &&
                (filterOff.ext || settings.fileExtensions.includes(ext)) &&
                !extraneousFiles.includes(name);
            if (keepFile)
                files.push({
                    origin: relativePath(posixPath(origin), source),
                    dest: relativePath(posixPath(dest), target),
                });
            return keepFolder || keepFile;
        };
        fs.cpSync(source, target, { filter: filter, recursive: true });
        return {
            source: source,
            target: target,
            count: files.length,
            duration: Date.now() - startTime,
            files: files,
        };
    },
};
export { copyFolder };
