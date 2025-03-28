import{y as E,_ as y,i as b,c,a as v,o as d,b as e,e as u,t as i,F as w,f as S,j as h,S as p,s as F,p as g,q as _,x as M,g as B,v as R,d as I,h as C,l as O}from"./index-BzoUKLuT.js";import{d as D}from"./es-CSMndH0g.js";import{u as x,w as V}from"./xlsx-xCRnwQcp.js";const T=E("clientStore",{state:()=>({solicitudIdTransporte:null,showSolicitudTransporte:!1}),getters:{getSolicitudIdTransporte:s=>s.solicitudIdTransporte,getShowSolicitudTransporte:s=>s.showSolicitudTransporte},actions:{setSolicitudIdTransporte(s){this.solicitudIdTransporte=s},clearSolicitudIdTransporte(){this.solicitudIdTransporte=null},setShowSolicitudTransporte(s){this.showSolicitudTransporte=s},clearShowSolicitudTransporte(){this.showSolicitudTransporte=!1}}}),L={name:"DetalleTransporte",props:{solicitudId:{type:Number,required:!0}},data(){return{isVisible:!0,loading:!1,solicitud:{},detalle:[],clientStore:null}},created(){this.clientStore=T()},methods:{formatDate(s){return s?new Date(s).toLocaleString():""},fetchDetalle(){this.loading=!0,b.post("/api/transferencias/detalle",{solicitudId:this.clientStore.getsolicitudIdTransporte}).then(s=>{const t=s.data;this.solicitud=t.solicitud,this.detalle=t.detalle}).catch(s=>{console.error("Error al obtener el detalle de transferencia:",s)}).finally(()=>{this.loading=!1})},closeModal(){this.isVisible=!1,this.clientStore.clearsolicitudIdTransporte(),this.$emit("close")}},mounted(){this.fetchDetalle()},watch:{solicitudId(s){s&&this.fetchDetalle()}}},A={key:0,class:"modal-wrapper",style:{"border-radius":"50px 50x 0px 0px !important"}},U={class:"modal-content",style:{"border-radius":"50px 50x 0px 0px !important"}},N={class:"modal-body p-2 m-2"},Y={key:0},j={key:1},q={class:"card-modal p-3 mb-3"},z={class:"row"},P={class:"col-md-6"},H={class:"mb-1"},$={class:"mb-1"},G={class:"col-md-6"},J={class:"mb-1"},K={class:"mb-1"},Q={class:"scroll-container"},W={class:"table table-bordered table-sm"},X={class:"modal-footer"};function Z(s,t,a,m,o,l){return o.isVisible?(d(),c("div",A,[e("div",U,[t[11]||(t[11]=e("div",{class:"modal-header card d-flex justify-content-start",style:{"border-radius":"50px 50x 0px 0px !important"}},[e("h5",{class:"modal-title"},[e("i",{class:"bi bi-truck me-2"}),u("Detalle de Transporte ")])],-1)),e("div",N,[o.loading?(d(),c("div",Y,t[1]||(t[1]=[e("p",null,"Cargando detalle...",-1)]))):(d(),c("div",j,[e("div",q,[t[6]||(t[6]=e("h6",{class:"mb-2"},"Solicitud",-1)),e("div",z,[e("div",P,[e("p",H,[t[2]||(t[2]=e("strong",null,"ID:",-1)),u(" "+i(o.solicitud.id),1)]),e("p",$,[t[3]||(t[3]=e("strong",null,"Estado:",-1)),u(" "+i(o.solicitud.estado),1)])]),e("div",G,[e("p",J,[t[4]||(t[4]=e("strong",null,"Observaciones:",-1)),u(" "+i(o.solicitud.observaciones),1)]),e("p",K,[t[5]||(t[5]=e("strong",null,"Fecha Solicitud:",-1)),u(" "+i(l.formatDate(o.solicitud.fechaSolicitud)),1)])])])]),t[8]||(t[8]=e("hr",null,null,-1)),t[9]||(t[9]=e("h6",null,"Detalle de la Transferencia",-1)),e("div",Q,[e("table",W,[t[7]||(t[7]=e("thead",null,[e("tr",{class:"text-center"},[e("th",null,"ID"),e("th",null,"Tipo"),e("th",null,"Referencia 2"),e("th",null,"Referencia 3"),e("th",null,"Estado"),e("th",null,"Descripción")])],-1)),e("tbody",null,[(d(!0),c(w,null,S(o.detalle,n=>(d(),c("tr",{key:n.id,class:"text-center"},[e("td",null,i(n.id),1),e("td",null,i(n.tipo),1),e("td",null,i(n.referencia2),1),e("td",null,i(n.referencia3),1),e("td",null,i(n.estado),1),e("td",null,i(n.descripcion),1)]))),128))])])])]))]),e("div",X,[e("button",{class:"custom-btn me-2",onClick:t[0]||(t[0]=(...n)=>l.closeModal&&l.closeModal(...n))},t[10]||(t[10]=[e("span",null,"Cerrar",-1)]))])])])):v("",!0)}const ee=y(L,[["render",Z],["__scopeId","data-v-d881e358"]]),te={name:"TransferenciaModal",props:{modalTitle:{type:String,default:"Confirmar Transferencia"},actionType:{type:String,default:"Confirmar"}},data(){return{newItemReferencia:"",itemsForm:[],observations:"",excelFile:null,clientStore:null}},computed:{showModal(){return this.clientStore.getShowSolicitudTransporte}},created(){this.clientStore=T()},methods:{addItem(){this.newItemReferencia.trim()!==""?(this.itemsForm.push({referencia2:this.newItemReferencia.trim()}),this.newItemReferencia=""):p.fire({icon:"warning",title:"Atención",text:"Ingrese un valor para la referencia.",timer:3e3,toast:!0,position:"top-end",showConfirmButton:!1})},removeItem(s){this.itemsForm.splice(s,1)},handleFileUpload(s){const t=s.target.files[0];t&&(this.excelFile=t)},async confirm(){const s=h(),t=s.user.clienteId||2,a=s.user.id||3;if(!this.itemsForm.length){p.fire({icon:"error",title:"Error",text:"Debe agregar al menos un ítem.",toast:!0,position:"top-end",timer:3e3,showConfirmButton:!1});return}const m={clienteId:t,usuarioId:a,items:this.itemsForm};try{const o=await b.post("/api/transferencias/crear",m);p.fire({icon:"success",title:"Transferencia Creada",text:`Solicitud #${o.data.solicitudId} - Consecutivo: ${o.data.consecutivo}`,footer:o.data.message,toast:!0,position:"bottom-end",timer:5e3,showConfirmButton:!1}),this.$emit("confirm",o.data),this.resetForm(),this.clientStore.clearShowSolicitudTransporte()}catch(o){console.error("Error al crear la transferencia:",o),p.fire({icon:"error",title:"Error",text:"No se pudo crear la transferencia. Por favor, inténtelo nuevamente.",toast:!0,position:"bottom-end",timer:5e3,showConfirmButton:!1})}},resetForm(){this.newItemReferencia="",this.itemsForm=[],this.observations="",this.excelFile=null},closeModal(){this.resetForm(),this.clientStore.clearShowSolicitudTransporte(),this.$emit("close")}}},se={key:0,class:"modal-wrapper"},oe={class:"modal-content"},re={class:"modal-header"},le={class:"modal-title"},ne={class:"modal-body p-2 m-2"},ie={class:"mb-3"},ae={class:"input-group"},de={key:0,class:"mb-3"},ce={class:"scroll-container"},ue={class:"table table-bordered table-sm"},fe=["onClick"],me={class:"mb-3"},pe={class:"mb-3"},he={class:"modal-footer"},be={type:"submit",class:"btn btn-primary"};function ve(s,t,a,m,o,l){return l.showModal?(d(),c("div",se,[e("div",oe,[e("div",re,[e("h5",le,i(a.modalTitle),1),e("button",{class:"btn-close",onClick:t[0]||(t[0]=(...n)=>l.closeModal&&l.closeModal(...n))},"×")]),e("div",ne,[e("form",{onSubmit:t[6]||(t[6]=F((...n)=>l.confirm&&l.confirm(...n),["prevent"]))},[e("div",ie,[t[7]||(t[7]=e("label",{class:"form-label"},"Agregar Ítem",-1)),e("div",ae,[g(e("input",{type:"text",class:"form-control",placeholder:"Ingrese Referencia","onUpdate:modelValue":t[1]||(t[1]=n=>o.newItemReferencia=n)},null,512),[[_,o.newItemReferencia]]),e("button",{type:"button",class:"btn btn-outline-secondary",onClick:t[2]||(t[2]=(...n)=>l.addItem&&l.addItem(...n))}," Agregar ")])]),o.itemsForm.length?(d(),c("div",de,[t[9]||(t[9]=e("label",{class:"form-label"},"Ítems a enviar",-1)),e("div",ce,[e("table",ue,[t[8]||(t[8]=e("thead",null,[e("tr",{class:"text-center"},[e("th",null,"#"),e("th",null,"Referencia"),e("th",null,"Acciones")])],-1)),e("tbody",null,[(d(!0),c(w,null,S(o.itemsForm,(n,f)=>(d(),c("tr",{key:f,class:"text-center"},[e("td",null,i(f+1),1),e("td",null,i(n.referencia2),1),e("td",null,[e("button",{type:"button",class:"btn btn-sm btn-danger",onClick:r=>l.removeItem(f)}," Eliminar ",8,fe)])]))),128))])])])])):v("",!0),e("div",me,[t[10]||(t[10]=e("label",{class:"form-label"},"Cargar Excel (opcional)",-1)),e("input",{type:"file",onChange:t[3]||(t[3]=(...n)=>l.handleFileUpload&&l.handleFileUpload(...n)),accept:".xlsx, .xls",class:"form-control"},null,32)]),e("div",pe,[t[11]||(t[11]=e("label",{class:"form-label"},"Observaciones (Opcional)",-1)),g(e("textarea",{class:"form-control",rows:"2","onUpdate:modelValue":t[4]||(t[4]=n=>o.observations=n),placeholder:"Escribe tus observaciones aquí."},null,512),[[_,o.observations]])]),e("div",he,[e("button",be,i(a.actionType),1),e("button",{type:"button",class:"btn btn-secondary",onClick:t[5]||(t[5]=(...n)=>l.closeModal&&l.closeModal(...n))}," Cancelar ")])],32)])])])):v("",!0)}const we=y(te,[["render",ve],["__scopeId","data-v-1e2f4a36"]]),Se={name:"transferenciasTable",components:{DetalleTransporte:ee,solicitarTransferencia:we},data(){return{selectedEstado:"TODOS",estadosDisponibles:[],transferencias:[],searchTerm:"",hoveredButton:"",hoveredId:null,idSolicitud:null}},computed:{clientStore(){return T()},filteredtransferencias(){const s=this.searchTerm.toLowerCase();return this.transferencias.filter(t=>(t.referencia1||"").toLowerCase().includes(s)||(t.referencia2||"").toLowerCase().includes(s)||(t.referencia3||"").toLowerCase().includes(s)||(t.cliente_nombre||"").toLowerCase().includes(s)||(t.usuario_nombre||"").toLowerCase().includes(s))}},mounted(){this.fetchEstados(),this.fetchtransferencias()},methods:{getDetalle(s){console.log("id solicitud transferencia: ",s),this.clientStore.setsolicitudIdTransporte,this.idSolicitud=s},showSolicitarTransferencia(){this.clientStore.setShowSolicitudTransporte(!this.clientStore.getShowSolicitudTransporte),console.log("Mostrar Solicitud: ",this.clientStore.getShowSolicitudTransporte)},async fetchEstados(){try{const s={tipo:"Desarchivo",clienteId:h().clienteId};console.log("payload listar estados : ",h().clienteId);const t=await b.post("/api/estados/listar",s);this.estadosDisponibles=t.data.data||["TODOS"],console.log("Estados: ",this.estadosDisponibles)}catch(s){console.error("Error al obtener los estados:",s)}},async fetchtransferencias(){try{const s=h().clienteId;if(!s){console.error("❌ Error: Cliente ID no encontrado.");return}const t={clienteId:s},a=await b.post("/api/transferencias/consultar",t);this.transferencias=a.data.data,O().hideLoader()}catch(s){console.error("Error al obtener datos de transferencias:",s)}},getEstadoClass(s){if(!s)return"text-secondary";const t=s.toLowerCase();return t.includes("disponible")?"fw-bold text-success":t.includes("solicitado")?"fw-bold text-warning":t.includes("entrega")?"fw-bold text-primary":t.includes("progreso")?"fw-bold text-info":t.includes("devuelto")?"fw-bold text-success":t.includes("rechazado")?"fw-bold text-danger":t.includes("anulado")?"fw-bold text-muted":"text-secondary fw-bold"},formatDate(s){return s?D(s).locale("es").format("DD/MM/YYYY HH:mm"):"N/A"},downloadFile(s){s&&window.open(s,"_blank")},exportToExcel(){const s=x.json_to_sheet(this.filteredtransferencias.map(a=>({ID:a.id,Cliente:a.cliente_nombre,Usuario:a.usuario_nombre,Objeto:a.objeto,Bodega:a.bodega,"Referencia 1":a.referencia1,"Referencia 2":a.referencia2,"Referencia 3":a.referencia3,Estado:a.estado,Modalidad:a.modalidad,"Dirección Entrega":a.direccion_entrega,Observaciones:a.observaciones,"Fecha Estimada":this.formatDate(a.fechaEstimada),"URL PDF":a.urlPdf||"N/A"}))),t=x.book_new();x.book_append_sheet(t,s,"transferencias"),V(t,`Bodegapp_transferencias_${D().format("YYYY-MM-DD")}.xlsx`)}}},ge={class:"inventario-container px-3 py-0 mt-0"},xe={class:"card shadow"},_e={class:"card-header px-0 py-0"},ye={class:"row align-items-center m-0 p-0 py-3 d-flex justify-content-between"},Te={class:"col-auto"},Ie={class:"custom-select"},Ce=["value"],De={class:"col-auto d-flex align-items-center gap-2"},ke={key:0},Ee={key:1},Fe={class:"custom-search"},Me={class:"card-body m-0 p-0"},Be={class:"table-container"},Re={class:"table table-sm table-bordered table-hover sticky-content"},Oe=["onClick"],Ve={class:"text-uppercase"};function Le(s,t,a,m,o,l){const n=C("DetalleTransporte"),f=C("solicitarTransferencia");return d(),c("div",ge,[e("div",xe,[e("div",_e,[e("div",ye,[e("div",Te,[e("div",Ie,[g(e("select",{"onUpdate:modelValue":t[0]||(t[0]=r=>o.selectedEstado=r),onChange:t[1]||(t[1]=(...r)=>l.fetchtransferencias&&l.fetchtransferencias(...r))},[t[8]||(t[8]=e("option",{value:"TODOS"},"TODOS",-1)),(d(!0),c(w,null,S(o.estadosDisponibles,r=>(d(),c("option",{key:r,value:r},i(r),9,Ce))),128))],544),[[R,o.selectedEstado]])])]),e("div",De,[e("button",{class:"custom-btn",style:{"background-color":"black !important",color:"white !important"},onClick:t[2]||(t[2]=(...r)=>l.showSolicitarTransferencia&&l.showSolicitarTransferencia(...r))},t[9]||(t[9]=[e("span",null,[e("i",{class:"bi bi-truck me-2"}),u("Solicitar Transferencia ")],-1)])),e("button",{class:"custom-btn excel me-2",onClick:t[3]||(t[3]=(...r)=>l.exportToExcel&&l.exportToExcel(...r)),onMouseover:t[4]||(t[4]=r=>o.hoveredButton="excel"),onMouseleave:t[5]||(t[5]=r=>o.hoveredButton="")},[e("i",{class:I(o.hoveredButton==="excel"?"bi bi-arrow-down-circle-fill":"bi bi-file-excel-fill")},null,2),o.hoveredButton!=="excel"?(d(),c("span",ke,"Excel")):(d(),c("span",Ee,"Descargar"))],32),e("div",Fe,[t[10]||(t[10]=e("i",{class:"bi bi-search search-icon"},null,-1)),g(e("input",{type:"text",class:"form-control form-control-sm",placeholder:"Buscar","onUpdate:modelValue":t[6]||(t[6]=r=>o.searchTerm=r)},null,512),[[_,o.searchTerm]])])])])]),e("div",Me,[e("div",Be,[e("table",Re,[t[11]||(t[11]=e("thead",{class:"sticky-header"},[e("tr",null,[e("th",null,"ID"),e("th",null,"Cliente"),e("th",null,"Usuario"),e("th",null,"Consecutivo"),e("th",null,"Estado"),e("th",null,"Fecha Solicitud"),e("th",null,"Fecha Verificación"),e("th",null,"Fecha Carga"),e("th",null,"Observaciones"),e("th",null,"Creado"),e("th",null,"Actualizado")])],-1)),e("tbody",null,[(d(!0),c(w,null,S(l.filteredtransferencias,(r,k)=>(d(),c("tr",{key:r.id||k,onClick:Ae=>l.getDetalle(r.id),style:{cursor:"pointer"}},[e("td",null,i(r.id),1),e("td",null,i(r.clienteId),1),e("td",null,i(r.usuarioCarga||r.usuarioVerifica),1),e("td",null,i(r.consecutivo),1),e("td",Ve,[e("span",{class:I(l.getEstadoClass(r.estado))},i(r.estado),3)]),e("td",null,i(l.formatDate(r.fechaSolicitud)),1),e("td",null,i(l.formatDate(r.fechaVerificacion)),1),e("td",null,i(l.formatDate(r.fechaCarga)),1),e("td",null,i(r.observaciones),1),e("td",null,i(l.formatDate(r.createdAt)),1),e("td",null,i(l.formatDate(r.updatedAt)),1)],8,Oe))),128))])])])])]),o.idSolicitud!==null?(d(),M(n,{key:0,solicitudId:o.idSolicitud,onClose:t[7]||(t[7]=r=>o.idSolicitud=null)},null,8,["solicitudId"])):v("",!0),B(f)])}const je=y(Se,[["render",Le]]);export{je as default};
