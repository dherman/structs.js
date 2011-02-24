/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the Structs library.
 *
 * The Initial Developer of the Original Code is
 * Dave Herman <dherman@mozilla.com>.
 * Portions created by the Initial Developer are Copyright (C) 2004
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Dave Herman <dherman@mozilla.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

// Some references on converting floats to ints:
//
// [1] http://java.sun.com/docs/books/jls/third_edition/html/conversions.html#5.1.3
// [2] https://wiki.mozilla.org/Jsctypes/api#Conversions
// [3] http://pubs.opengroup.org/onlinepubs/009695399/functions/lrint.html
// [4] http://www.mega-nerd.com/FPcast/
// [5] http://dev.w3.org/2006/webapi/WebIDL/#es-type-mapping

function ToInt32(x) {
    return x >> 0;
}

// [ ... sign-extend ... ] [ ......... mask ........ ]
// [ 31 ] --------> [ 15 ] X X X X X X X X X X X X X X
function ToInt16(x) {
    return ((x & 0x80000000) >> 16) | (x & 0x7fff);
}

// [ .......... sign-extend .......... ] [ .. mask . ]
// [ 31 ] -----------------------> [ 7 ] X X X X X X X
function ToInt8(x) {
    return ((x & 0x80000000) >> 24) | (x & 0x7f);
}

function ToUint32(x) {
    return x >>> 0;
}

function ToUint16(x) {
    return (x >>> 0) & 0xffff;
}

function ToUint8(x) {
    return (x >>> 0) & 0xff;
}
