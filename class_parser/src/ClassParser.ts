
const numToHex = (num: number) => num.toString(16).toUpperCase();

export class ClassParser{
    constructor(public readonly data: Uint8Array) {
        this.index = 0;
    }

    async process(): Promise<ClassParser> {
        try {
            this.processMagic();
            this.processVersion();
            this.processConstantPool();
            this.processAccessFlag();
            this.processThisClass();
            this.processSuperClass();
            this.processInterface();
            this.processField();
            this.processMethod();
            this.processAttribute();
        } catch(err: unknown) {
            console.log(err);
        }
        return this;
    }

    index: number;

    magic: string = '';
    processMagic() {
        this.magic = Array.from(this.data.slice(this.index, 4)).map(c => numToHex(c)).join('');
        this.index += 4;
    }
    minorVersion: number = 0;
    majorVersion: number = 0;
    processVersion() {
        this.minorVersion = (this.data[this.index] << 8) + this.data[this.index+1];
        this.index += 2;
        this.majorVersion = (this.data[this.index] << 8) + this.data[this.index+1];
        this.index += 2;
    }
    constantCount: number = 0;
    constants: string[] = [];
    processConstantPool() {
        this.constantCount = (this.data[this.index] << 8) + this.data[this.index+1];
        this.index += 2;

    }
    processAccessFlag() {}
    processThisClass() {}
    processSuperClass() {}
    processInterface() {}
    processField() {}
    processMethod() {}
    processAttribute() {}

};
