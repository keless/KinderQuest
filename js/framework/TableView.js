"use strict"; //ES6

class TableView extends NodeView {
	static get VERTICAL() { return 0; }
	static get HORIZONTAL() { return 1; }
	
	static get ALIGN_LEFT() { return 0; }
	static get ALIGN_CENTER() { return 1; }
	static get ALIGN_RIGHT() { return 2; }

	constructor( w, h ) {
		super();
		
		this.m_cells = [];
		this.m_scrollOffsetX = 0;
		this.m_scrollOffsetY = 0;
		this.padding = 5;

		this.align = TableView.ALIGN_LEFT;
		
		this.size.setVal(w,h);
		
		this.direction = TableView.VERTICAL;
	}
	
	addCell( cell ) {
		this.m_cells.push(cell);
	}
	
	removeCellAtIndex( idx ) { 
		this.m_cells = this.m_cells.splice(idx, 1);
	}

	removeAllCells() {
		this.m_cells.length = 0;
	}
	
	//x,y should be sent relative to node origin
	OnMouseDown(e, x,y) {

		//make local to self origin
		x -= this.pos.x;
		y -= this.pos.y;
		x -= this.m_scrollOffsetX;
		y -= this.m_scrollOffsetY;	

		var off = 0;
		var start = 0;
		if( this.direction == TableView.VERTICAL ) {
			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].OnMouseDown(e, x, (y - off));
				if(e.isDone) return;
				off += this.m_cells[i].getHeight() + this.padding;
			}
		} else {
			if(this.align == TableView.ALIGN_LEFT) {
				start -= this.size.x/2 * 0.8;
			}

			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].OnMouseDown(e, (x - (start + off)), y);
				if(e.isDone) return;
				off += this.m_cells[i].getWidth() + this.padding;
			}
		}
	}
	
	Draw( gfx, x, y, ct ) {
		
		gfx.saveMatrix();
		gfx.translate(x + this.pos.x, y + this.pos.y);

		if(this.rotation != 0) {
			gfx.rotate(this.rotation);
		}
		
		if(this.scale != 1) {
			gfx.scale(this.scale);
		}

		for(var f of this.fnCustomDraw) {
			f(gfx, 0,0, ct);
		}
		
		x -= this.m_scrollOffsetX;
		y -= this.m_scrollOffsetY;
		
		var off = 0;
		var start = 0;
		if( this.direction == TableView.VERTICAL ) {
			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].Draw(gfx, 0, off, ct);
				off += this.m_cells[i].getHeight() + this.padding;
			}
		} else {
			if(this.align == TableView.ALIGN_LEFT) {
				start -= this.size.x/2 * 0.8;
			}

			for( var i=0; i<this.m_cells.length; i++) {
				this.m_cells[i].Draw(gfx, start + off, 0, ct);
				off += this.m_cells[i].getWidth() + this.padding;
			}
		}
		
		for(var child of this.children) {
			//note: dont subtract this.pos, since we're using gfx.translate
			child.Draw(gfx, 0, 0, ct);
		}
		
		gfx.restoreMatrix();
	}
}