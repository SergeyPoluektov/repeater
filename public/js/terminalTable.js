/**
 * Created by spolu on 04.06.2016.
 */
class TerminalTable {
    constructor(options) {
        this._parentElem = options.elem;

        this._addTerminal = this._addTerminal.bind(this);
        this._updateRxCount = this._updateRxCount.bind(this);
        this._updateTxCount = this._updateTxCount.bind(this);
        this._updateRxCountDel = this._updateRxCountDel.bind(this);

        this._render();

        this._socket = io('http://192.168.2.250');

        this._socket.on('addToTable', this._addTerminal);
        this._socket.on('updateRxCount', this._updateRxCount);
        this._socket.on('updateTxCount', this._updateTxCount);
        this._socket.on('updateRxCountDel', this._updateRxCountDel);
    }

    _render() {
        this._parentElem.insertAdjacentHTML("afterBegin", `
                <table class="table">
                    <thead>
                    <tr>
                        <th>ID терминала</th>
                        <th>Записано пакетов</th>
                        <th>Передано пакетов на сервер при последнем сеансе</th>
                    </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            `);
    }

    _addTerminal(data) {
        this._tableBody = this._parentElem.children[0].tBodies[0];
        let tagId = 'id' + data.termId;
        let row = this._tableBody.querySelector('#' + tagId);
        if (!row) {
            row = document.createElement('tr');
            row.insertAdjacentHTML('afterBegin', `
                    <td>${data.termId}</td><td>${data.rxElemCount}</td><td>${data.txElemCount}</td>
                `);
            row.id = 'id' + data.termId;
            this._tableBody.appendChild(row);
        }
        else {
            row.cells[1].textContent = data.rxElemCount;
            row.cells[2].textContent = data.txElemCount;
        }
    }

    _updateRxCountDel(data) {
        let tagId = 'id' + data.termId;
        let row = this._tableBody.querySelector('#' + tagId);
        if (row) {
            row.cells[1].textContent -= data.rxElemCount;
        }
    }

    _updateRxCount(data) {
        let tagId = 'id' + data.termId;
        let row = this._tableBody.querySelector('#' + tagId);
        if (row) {
            row.cells[1].textContent = data.rxElemCount;
        }
    }

    _updateTxCount(data) {
        let tagId = 'id' + data.termId;
        let row = this._tableBody.querySelector('#' + tagId);
        if (row) {
            row.cells[2].textContent = data.txElemCount;
        }
    }
}

new TerminalTable({
    elem: document.body.querySelector('#terminalTable')
});