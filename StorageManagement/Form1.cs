using System;
using System.Data;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Printing;
using System.IO;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using PicoXLSX;

namespace StorageManagement
{
    public partial class Form1 : Form
    {
        DataTable dt2 = new DataTable();
        DataTable dt = new DataTable();

        public Form1()
        {
            InitializeComponent();
            load_csv();

            foreach (DataGridViewColumn column in dataGridView1.Columns)
            {
                column.SortMode = DataGridViewColumnSortMode.NotSortable;
            }
        }

        //drag n drop

        private Rectangle dragBoxFromMouseDown;
        private int rowIndexFromMouseDown;
        private int rowIndexOfItemUnderMouseToDrop;

        private void dataGridView1_MouseMove(object sender, MouseEventArgs e)
        {
            if ((e.Button & MouseButtons.Left) == MouseButtons.Left)
            {
                // If the mouse moves outside the rectangle, start the drag.
                if (dragBoxFromMouseDown != Rectangle.Empty &&
                !dragBoxFromMouseDown.Contains(e.X, e.Y))
                {
                    // Proceed with the drag and drop, passing in the list item.                    
                    DragDropEffects dropEffect = dataGridView1.DoDragDrop(
                          dataGridView1.Rows[rowIndexFromMouseDown],
                          DragDropEffects.Move);
                }
            }
        }

        private void dataGridView1_MouseDown(object sender, MouseEventArgs e)
        {
            // Get the index of the item the mouse is below.
            rowIndexFromMouseDown = dataGridView1.HitTest(e.X, e.Y).RowIndex;

            if (rowIndexFromMouseDown != -1)
            {
                // Remember the point where the mouse down occurred. 
                // The DragSize indicates the size that the mouse can move 
                // before a drag event should be started.                
                Size dragSize = SystemInformation.DragSize;

                // Create a rectangle using the DragSize, with the mouse position being
                // at the center of the rectangle.
                dragBoxFromMouseDown = new Rectangle(
                          new Point(
                            e.X - (dragSize.Width / 2),
                            e.Y - (dragSize.Height / 2)),
                      dragSize);
            }
            else
                // Reset the rectangle if the mouse is not over an item in the ListBox.
                dragBoxFromMouseDown = Rectangle.Empty;
        }

        private void dataGridView1_DragOver(object sender, DragEventArgs e)
        {
            e.Effect = DragDropEffects.Move;
        }

        private void dataGridView1_DragDrop(object sender, DragEventArgs e)
        {
            // The mouse locations are relative to the screen, so they must be 
            // converted to client coordinates.
            Point clientPoint = dataGridView1.PointToClient(new Point(e.X, e.Y));

            // Get the row index of the item the mouse is below. 
            rowIndexOfItemUnderMouseToDrop = dataGridView1.HitTest(clientPoint.X, clientPoint.Y).RowIndex;

            // If the drag operation was a move then remove and insert the row.
            if (e.Effect == DragDropEffects.Move && rowIndexOfItemUnderMouseToDrop!=-1 && rowIndexOfItemUnderMouseToDrop!= rowIndexFromMouseDown)
            {
                DataGridViewRow rowToMove = e.Data.GetData(typeof(DataGridViewRow)) as DataGridViewRow;
                DataRow finalrow = dt.NewRow();
                finalrow.ItemArray = (rowToMove.DataBoundItem as DataRowView).Row.ItemArray;
                dt.Rows.RemoveAt(rowIndexFromMouseDown);
                dt.Rows.InsertAt( finalrow, rowIndexOfItemUnderMouseToDrop);
                for (int i = 1; (i - 1) < dataGridView1.Rows.Count; i++)
                {
                    dataGridView1.Rows[i - 1].Cells[0].Value = i;
                }
                dataGridView1.DataSource = dt;
            }
        }

        //

        private void load_csv()
        {
            var linesx = System.IO.File.ReadAllLines("Inventory.csv").Where(x => !string.IsNullOrWhiteSpace(x)); //change for any other path
            string[] lines = linesx.ToArray<string>();
            if (lines.Length > 0)
            {
                //first line to create header
                string firstLine = lines[0];
                string[] headerLabels = firstLine.Split(',');
                foreach (string headerWord in headerLabels)
                {
                    dt.Columns.Add(new DataColumn(headerWord));
                }
                //For Data
                for (int i = 1; i < lines.Length; i++)
                {
                    string[] dataWords = lines[i].Split(',');
                    DataRow dr = dt.NewRow();
                    int columnIndex = 0;
                    foreach (string headerWord in headerLabels)
                    { 
                        dr[headerWord] = dataWords[columnIndex++];
                    }
                    dt.Rows.Add(dr);
                }
            }
            if (dt.Rows.Count > 0)
            {
                dataGridView1.DataSource = dt;
                dataGridView1.Columns[0].AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells;
                for (int k=1; k<dataGridView1.Columns.Count; k++)
                {
                    dataGridView1.Columns[k].AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill;
                }
                
            }

            
            var lines2x = System.IO.File.ReadAllLines("Report.csv").Where(x => !string.IsNullOrWhiteSpace(x)); //change for any other path
            string[] lines2 = lines2x.ToArray<string>();
            if (lines2.Length > 0)
            {
                //first line to create header
                string firstLine2 = lines2[0];
                string[] headerLabels2 = firstLine2.Split(',');
                foreach (string headerWord in headerLabels2)
                {
                    dt2.Columns.Add(new DataColumn(headerWord));
                }
                //For Data
                for (int i = 1; i < lines2.Length; i++)
                {
                    string[] dataWords = lines2[i].Split(',');
                    DataRow dr = dt2.NewRow();
                    int columnIndex = 0;
                    foreach (string headerWord in headerLabels2)
                    {
                        dr[headerWord] = dataWords[columnIndex++];
                    }
                    dt2.Rows.Add(dr);
                }
            }
            if (dt2.Rows.Count > 0)
            {
                dataGridView2.DataSource = dt2;
                dataGridView2.Columns[0].AutoSizeMode = DataGridViewAutoSizeColumnMode.AllCells;
                for (int k = 1; k < dataGridView2.Columns.Count; k++)
                {
                    dataGridView2.Columns[k].AutoSizeMode = DataGridViewAutoSizeColumnMode.Fill;
                }
            }
        }

        private void button3_Click(object sender, EventArgs e)  //apothikeusi
        {
            (dataGridView1.DataSource as DataTable).DefaultView.RowFilter = "";
            (dataGridView2.DataSource as DataTable).DefaultView.RowFilter = "";
            bool fileError = false;

                if (File.Exists("Inventory.csv") && File.Exists("Report.csv"))
                {
                    try
                    {
                        File.Delete("Inventory.csv");
                        File.Delete("Report.csv");
                    }
                    catch (System.IO.IOException ex)
                    {
                        fileError = true;
                        MessageBox.Show("Δεν ήταν δυνατό να αποθηκευτεί το αρχείο." + ex.Message);
                    }
                }
                if (!fileError)
                {
                    try
                    {
                        int columnCount = dataGridView1.Columns.Count;
                        int columnCount2 = dataGridView2.Columns.Count;
                        string columnNames = "";
                        string columnNames2 = "";
                        string[] outputCsv = new string[dataGridView1.Rows.Count+1];
                        string[] outputCsv2 = new string[dataGridView2.Rows.Count+1];

                        
                        for (int i = 0; i < columnCount; i++)
                        {
                            if (i == columnCount - 1)
                            {
                                columnNames += dataGridView1.Columns[i].HeaderText.ToString();
                            }
                            else
                            {
                                columnNames += dataGridView1.Columns[i].HeaderText.ToString() + ",";
                            }
                        }
                        outputCsv[0] += columnNames;

                        for (int i = 1; (i-1) < dataGridView1.Rows.Count; i++)
                        {
                            for (int j = 0; j < columnCount; j++)
                            {
                                if (j == columnCount - 1)
                                {
                                    outputCsv[i] += dataGridView1.Rows[i-1].Cells[j].Value.ToString();
                                }
                                else
                                {
                                    outputCsv[i] += dataGridView1.Rows[i-1].Cells[j].Value.ToString() + ",";
                                }
                            }
                        }
                        File.WriteAllLines("Inventory.csv", outputCsv, Encoding.UTF8); //save changes in the package
                        MessageBox.Show("Η αποθήκευση των αλλαγών ήταν επιτυχής", "Info");
                    
                    //

                        for (int i = 0; i < columnCount2; i++)
                        {
                            if (i == columnCount2 - 1)
                            {
                                columnNames2 += dataGridView2.Columns[i].HeaderText.ToString();
                            }
                            else
                            {
                                columnNames2 += dataGridView2.Columns[i].HeaderText.ToString() + ",";
                            }
                        }
                        outputCsv2[0] += columnNames2;

                        for (int i = 1; (i - 1) < dataGridView2.Rows.Count; i++)
                        {
                            for (int j = 0; j < columnCount2; j++)
                            {
                                if (j == columnCount2 - 1)
                                {
                                    outputCsv2[i] += dataGridView2.Rows[i - 1].Cells[j].Value.ToString();
                                }
                                else
                                {
                                    outputCsv2[i] += dataGridView2.Rows[i - 1].Cells[j].Value.ToString() + ",";
                                }
                            }
                        }
                        File.WriteAllLines("Report.csv", outputCsv2, Encoding.UTF8); //save changes in the package
                }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Error :" + ex.Message);
                    }
                }
        }

        private void exportexcelgrid1(string param)
        {
            Workbook workbook = new Workbook(param, "Inventory");
            string x = workbook.CurrentWorksheet.MergeCells(new Cell.Range(new PicoXLSX.Cell.Address(0, 0), new PicoXLSX.Cell.Address(3, 0)));
            workbook.WS.Value("Καταγραφή Αποθήκης " + DateTime.Now.ToString("dd/MM/yyyy"), Style.BasicStyles.Bold);
            workbook.WS.Down();
            workbook.WS.Down();
            for (int i = 1; i < dataGridView1.Columns.Count + 1; i++)
            {
                Style style = new Style();
                style.CurrentBorder = Style.BasicStyles.BorderFrame.CurrentBorder;
                style.CurrentFont = Style.BasicStyles.Bold.CurrentFont;
                workbook.WS.Value(dataGridView1.Columns[i - 1].HeaderText, style);
            }
            workbook.WS.Down();
            for (int i = 0; i < dataGridView1.Rows.Count - 1; i++)
            {
                for (int j = 0; j < dataGridView1.Columns.Count; j++)
                {
                    workbook.WS.Value(dataGridView1.Rows[i].Cells[j].Value.ToString(), Style.BasicStyles.BorderFrame);
                }
                workbook.WS.Down();
            }
            workbook.CurrentWorksheet.SetColumnWidth(0, 7);
            workbook.CurrentWorksheet.SetColumnWidth(1, 30);
            workbook.CurrentWorksheet.SetColumnWidth(2, 35);
            workbook.CurrentWorksheet.SetColumnWidth(3, 10);
            workbook.Save();
        }

        private void exportexcelgrid2(string param)
        {
            Workbook workbook = new Workbook(param, "Report");
            string x = workbook.CurrentWorksheet.MergeCells(new Cell.Range(new PicoXLSX.Cell.Address(0, 0), new PicoXLSX.Cell.Address(3, 0)));
            workbook.WS.Value("Αναφορά Κινήσεων Αποθήκης " + DateTime.Now.ToString("dd/MM/yyyy"), Style.BasicStyles.Bold);
            workbook.WS.Down();
            workbook.WS.Down();
            for (int i = 1; i < dataGridView2.Columns.Count + 1; i++)
            {
                Style style = new Style();
                style.CurrentBorder = Style.BasicStyles.BorderFrame.CurrentBorder;
                style.CurrentFont = Style.BasicStyles.Bold.CurrentFont;
                workbook.WS.Value(dataGridView2.Columns[i - 1].HeaderText, style);
            }
            workbook.WS.Down();
            for (int i = 0; i < dataGridView2.Rows.Count - 1; i++)
            {
                for (int j = 0; j < dataGridView2.Columns.Count; j++)
                {
                    workbook.WS.Value(dataGridView2.Rows[i].Cells[j].Value.ToString(), Style.BasicStyles.BorderFrame);
                }
                workbook.WS.Down();
            }
            workbook.CurrentWorksheet.SetColumnWidth(0, 7);
            workbook.CurrentWorksheet.SetColumnWidth(1, 12);
            workbook.CurrentWorksheet.SetColumnWidth(2, 10);
            workbook.CurrentWorksheet.SetColumnWidth(3, 22);
            workbook.CurrentWorksheet.SetColumnWidth(4, 30);
            workbook.Save();
        }

        private void button4_Click(object sender, EventArgs e)  //eksagwgi
        {
            (dataGridView1.DataSource as DataTable).DefaultView.RowFilter = "";
            (dataGridView2.DataSource as DataTable).DefaultView.RowFilter = "";


            SaveFileDialog sfd = new SaveFileDialog();
            sfd.Filter = "XLSX (*.xlsx)|*.xlsx";

            if (tabControl1.SelectedTab.Name == "tabPage1")
            {
                sfd.FileName = "Inventory.xlsx";
            }
            else
            {
                sfd.FileName = "Report.xlsx";
            }
            bool fileError = false;
            if (sfd.ShowDialog() == DialogResult.OK)
            {
                if (File.Exists(sfd.FileName))
                {
                    try
                    {
                        File.Delete(sfd.FileName);
                    }
                    catch (System.IO.IOException ex)
                    {
                        fileError = true;
                        MessageBox.Show("Δεν ήταν δυνατό να αποθηκευτεί το αρχείο." + ex.Message);
                    }
                }
                if (!fileError)
                {
                    try
                    {
                        if (tabControl1.SelectedTab.Name == "tabPage1")
                        {
                            exportexcelgrid1(sfd.FileName);
                        }
                        else
                        {
                            exportexcelgrid2(sfd.FileName);
                        }
                        MessageBox.Show("Η εξαγωγή ήταν επιτυχής", "Info");
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Error :" + ex.Message);
                    }
                }
            }
        }

        private void button1_Click(object sender, EventArgs e) //eisagwgi me barcode
        {
            string bc_check=textBox1.Text;
            string r_check="";
            int itm_num;

            if (bc_check == "")
            {
                MessageBox.Show("Παρακαλώ εισάγετε BARCODE");
            }
            else { 
                try {
                    itm_num = (int) numericUpDown1.Value;
                }
                catch (System.FormatException)
                {
                    itm_num = -1;
                    MessageBox.Show("Παρακαλώ εισάγετε σωστό αριθμό τεμαχίων");
                }     

                if (itm_num > 0) {
                    int count = 0;
                    for (int i=0; i<dataGridView1.RowCount; i++)
                    {
                        r_check = (string) dataGridView1.Rows[i].Cells[1].Value;
                        if (bc_check == r_check)
                        {
                            dataGridView1.Rows[i].Cells[3].Value = Int32.Parse((string)dataGridView1.Rows[i].Cells[3].Value) + itm_num; //allagi an einai parapanw ta columns en telei
                            DateTime time = DateTime.Now;
                            DataRow row= dt2.NewRow();
                            row[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count-1][0])+1;
                            row[1] = time.ToString("dd/MM/yyy");
                            row[2] = time.ToString("HH:mm:ss");
                            row[3] = bc_check;
                            row[4] = itm_num;
                            dt2.Rows.Add(row);
                            MessageBox.Show("Επιτυχής Παραλαβή");
                            count++;
                        }
                    }
                    if (count == 0)
                    {
                        MessageBox.Show("Δεν βρέθηκε καταχώρηση με αυτό το BARCODE");
                    }
                }
            }
            dataGridView1.DataSource = dt;
            dataGridView2.DataSource = dt2;
        }

        private void button2_Click(object sender, EventArgs e) //eksagwgi me barcode
        {
            string bc_check = textBox1.Text;
            string r_check = "";
            int itm_num;

            if (bc_check == "")
            {
                MessageBox.Show("Παρακαλώ εισάγετε BARCODE");
            }
            else
            {
                try
                {
                    itm_num = (int) numericUpDown1.Value;
                }
                catch (System.FormatException)
                {
                    itm_num = -1;
                    MessageBox.Show("Παρακαλώ εισάγετε σωστό αριθμό τεμαχίων");
                }

                if (itm_num > 0)
                {
                    int count = 0;
                    for (int i =0; i < dataGridView1.RowCount; i++)
                    {
                        r_check = (string)dataGridView1.Rows[i].Cells[1].Value;
                        if (bc_check == r_check)
                        {
                            if((Int32.Parse((string)dataGridView1.Rows[i].Cells[3].Value) - itm_num) > 0) {
                                dataGridView1.Rows[i].Cells[3].Value = Int32.Parse((string)dataGridView1.Rows[i].Cells[3].Value) - itm_num; //allagi an einai parapanw ta columns en telei
                                DateTime time = DateTime.Now;
                                DataRow row = dt2.NewRow();
                                row[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count - 1][0]) + 1;
                                row[1] = time.ToString("dd/MM/yyy");
                                row[2] = time.ToString("HH:mm:ss");
                                row[3] = bc_check;
                                row[4] = "-" + itm_num;
                                dt2.Rows.Add(row);
                                count++;
                                MessageBox.Show("Επιτυχής Εξαγωγή");
                            }
                            else
                            {
                                DateTime time = DateTime.Now;
                                DataRow row = dt2.NewRow();
                                row[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count - 1][0]) + 1;
                                row[1] = time.ToString("dd/MM/yyy");
                                row[2] = time.ToString("HH:mm:ss");
                                row[3] = bc_check;
                                row[4] = "-"+ (string)dataGridView1.Rows[i].Cells[3].Value;
                                dt2.Rows.Add(row);
                                dataGridView1.Rows[i].Cells[3].Value = 0;
                                count++;
                                MessageBox.Show("Επιτυχής Εξαγωγή");
                            }
                        }
                    }
                    if (count == 0)
                    {
                        MessageBox.Show("Δεν βρέθηκε καταχώρηση με αυτό το BARCODE");
                    }
                }
            }
            dataGridView1.DataSource = dt;
            dataGridView2.DataSource = dt2;
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        private void dataGridView1_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            edit_line();
        }

        private void button7_Click(object sender, EventArgs e) //prosthiki stoixeiou, stoixeia apo deuteri forma kai elegxos an yparxei idi kataxwrisi. an yparxei san apli paralavi
        {
                Form2 form = new Form2((dataGridView1.Rows.Count + 1));
                form.Text = "Προσθήκη Στοιχείου";
                var result = form.ShowDialog();
                if (result == DialogResult.OK)
                {
                    string x1 = "" + (dataGridView1.Rows.Count + 1);
                    string x2 = form.L2;
                    string x3 = form.L3;
                    string x4 = form.L4;
                //
                int count=0;
                for (int i = 1; i < dataGridView1.RowCount; i++)
                {
                    string r_check = (string)dataGridView1.Rows[i].Cells[1].Value;
                    if (form.L2 == r_check)
                    {
                        dataGridView1.Rows[i].Cells[3].Value = Int32.Parse((string)dataGridView1.Rows[i].Cells[3].Value) + Int32.Parse(form.L4); //allagi an einai parapanw ta columns en telei
                        MessageBox.Show("Επιτυχής Παραλαβή");
                    }
                    else
                    {
                        count++;
                    }
                }
                if (count== dataGridView1.RowCount - 1)
                {
                    DataRow row = dt.NewRow();
                    row[0] = x1;
                    row[1] = x2;
                    row[2] = x3;
                    row[3] = x4;
                    dt.Rows.Add(row);
                }
                    DateTime time = DateTime.Now;
                    DataRow row2 = dt2.NewRow();
                    row2[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count - 1][0]) + 1;
                    row2[1] = time.ToString("dd/MM/yyy");
                    row2[2] = time.ToString("HH:mm:ss");
                    row2[3] = x2;
                    row2[4] = x4;

                    dt2.Rows.Add(row2);
            }
            dataGridView1.DataSource = dt;
            dataGridView2.DataSource = dt2;
        }

        

        private void button5_Click(object sender, EventArgs e) //epekserg
        {
            edit_line();
        }

        private void edit_line()
        {
            DataRow row = ((DataRowView)BindingContext[dataGridView1.DataSource].Current).Row;
            int row_ed = row.Table.Rows.IndexOf(row);
            Form2 form = new Form2(Int32.Parse((string)dt.Rows[row_ed][0]), (string)dt.Rows[row_ed][1], (string)dt.Rows[row_ed][2], Int32.Parse((string)dt.Rows[row_ed][3]));

            var result = form.ShowDialog();
            if (result == DialogResult.OK)
            {
                string x1 = form.L1;
                string x2 = form.L2;
                string x3 = form.L3;
                string x4 = form.L4;


                dt.Rows[row_ed][0] = x1;
                dt.Rows[row_ed][1] = x2;
                dt.Rows[row_ed][2] = x3;
                dt.Rows[row_ed][3] = x4;

                DateTime time = DateTime.Now;
                DataRow row2 = dt2.NewRow();
                row2[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count - 1][0]) + 1;
                row2[1] = time.ToString("dd/MM/yyy");
                row2[2] = time.ToString("HH:mm:ss");
                row2[3] = dt.Rows[row_ed][1];
                row2[4] = "Επεξεργασία Στοιχείου ΤΜΧ: " + dt.Rows[row_ed][3];
                dt2.Rows.Add(row2);

            }
            dataGridView1.DataSource = dt;
            dataGridView2.DataSource = dt2;
        }

        private void button6_Click(object sender, EventArgs e) //diagr
        {
            DataRow row = ((DataRowView)BindingContext[dataGridView1.DataSource].Current).Row;
            int row_del = row.Table.Rows.IndexOf(row);

            DateTime time = DateTime.Now;
            DataRow row2 = dt2.NewRow();
            row2[0] = Int32.Parse((string)dt2.Rows[dt2.Rows.Count - 1][0]) + 1;
            row2[1] = time.ToString("dd/MM/yyy");
            row2[2] = time.ToString("HH:mm:ss");
            row2[3] = dt.Rows[row_del][1];
            row2[4] = "Διαγραφή Στοιχείου ΤΜΧ: "+ dt.Rows[row_del][3];
            dt2.Rows.Add(row2);

            var confirmResult = MessageBox.Show("Θέλετε σίγουρα να διαγράψετε αυτό το στοιχείο;","Επιβεβαίωση Διαγραφής",MessageBoxButtons.YesNo);
            if (confirmResult == DialogResult.Yes)
            {
                dt.Rows[row_del].Delete();
            }
            dataGridView1.DataSource = dt;
            dataGridView2.DataSource = dt2;
        }

        private void button8_Click(object sender, EventArgs e) //odig xr
        {
            var p = new Process();
            p.StartInfo = new ProcessStartInfo("instructions.pdf")
            {
                UseShellExecute = true
            };
            p.Start();
        }

        private void button9_Click(object sender, EventArgs e) //cred
        {
            Form3 form = new Form3();
            form.Show();
        }
        
        private void tabControl1_SelectedIndexChanged(object sender, EventArgs e)
        {
            if (tabControl1.SelectedTab.Name != "tabPage1")
            {
                button5.Visible = false;
                button6.Visible = false;
                button7.Visible = false;
            }
            else
            {
                button5.Visible = true;
                button6.Visible = true;
                button7.Visible = true;
            }
        }

        private void textBox3_TextChanged(object sender, EventArgs e)
        {
            if (tabControl1.SelectedTab.Name == "tabPage1")
                if (textBox3.Text != "") { 
                    (dataGridView1.DataSource as DataTable).DefaultView.RowFilter = string.Format("BARCODE LIKE '%{0}%' OR DESCRIPTION LIKE '%{0}%'", textBox3.Text);
                }
                else
                {
                    (dataGridView1.DataSource as DataTable).DefaultView.RowFilter = "";
                }
            else
            {
                if (textBox3.Text != "")
                {
                    (dataGridView2.DataSource as DataTable).DefaultView.RowFilter = string.Format("BARCODE LIKE '%{0}%' OR DATE LIKE '%{0}%'", textBox3.Text);
                }
                else
                {
                    (dataGridView2.DataSource as DataTable).DefaultView.RowFilter = "";
                }
            }
        }


        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (new StackTrace().GetFrames().Any(x => x.GetMethod().Name == "Close")) //close
            {
                var res = MessageBox.Show(this, "Αποθήκευση των στοιχείων πριν την έξοδο;", "Exit",
                MessageBoxButtons.YesNoCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);
                if (res == DialogResult.Yes)
                {
                    button3.PerformClick();
                }
                else if (res == DialogResult.Cancel)
                {
                    e.Cancel = true;
                }
            }
            else  //alt f4 or X
            {
                var res2 = MessageBox.Show(this, "Αποθήκευση των στοιχείων πριν την έξοδο;", "Exit",
                MessageBoxButtons.YesNoCancel, MessageBoxIcon.Warning, MessageBoxDefaultButton.Button2);
                if (res2 == DialogResult.Yes)
                {
                    button3.PerformClick();
                }
                else if(res2 == DialogResult.Cancel)
                {
                    e.Cancel = true;
                }
            }
        }

        private void dataGridView1_CellFormatting(object sender, DataGridViewCellFormattingEventArgs e)
        {
            for (int i = 0; i < dataGridView1.Rows.Count; i++)
            {
                string desc = dataGridView1.Rows[i].Cells[2].Value.ToString();
                if (desc.Contains("perCP")) //mpornto
                {
                    DataGridViewCellStyle style = new DataGridViewCellStyle();
                    style.BackColor = Color.OrangeRed;
                    style.ForeColor = Color.White;
                    dataGridView1.Rows[i].Cells[2].Style = style;

                }
                else if (desc.Contains("PE")) //kokkino
                {
                    DataGridViewCellStyle style = new DataGridViewCellStyle();
                    style.BackColor = Color.Red;
                    style.ForeColor = Color.White;
                    dataGridView1.Rows[i].Cells[2].Style = style;
                }
                else if (desc.Contains("FITC")) //prasino
                {
                    DataGridViewCellStyle style = new DataGridViewCellStyle();
                    style.BackColor = Color.DarkGreen;
                    style.ForeColor = Color.White;
                    dataGridView1.Rows[i].Cells[2].Style = style;
                }
                else //
                {
                    DataGridViewCellStyle style = new DataGridViewCellStyle();
                    style.BackColor = Color.White;
                    style.ForeColor = Color.Black;
                    dataGridView1.Rows[i].Cells[2].Style = style;
                }
            }
        }
    } 
 }

