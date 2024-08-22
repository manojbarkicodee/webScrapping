import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  styled,
  tableCellClasses,
} from "@mui/material";
import ClearAllIcon from '@mui/icons-material/ClearAll';
import CircularProgress from "@mui/material/CircularProgress";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useLocation, useParams } from "react-router-dom";
import styles from "./Contacts.module.css";
import * as XLSX from "xlsx";
import Jobs from "../jobs/Jobs";
import { Chip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import ReplayIcon from "@mui/icons-material/Replay";
const label = { inputProps: { "aria-label": "Checkbox demo" } };

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  " &:last-child th": {
    border: 0,
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "grey",
    color: theme.palette.common.white,
    maxWidth: "10vw",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

// import React, { useState } from 'react';

const FilterComponent = ({
  filters,
  setFiltersOptions,
  setSelectedFilters,
  applyFilter,
  setApplyFilter,
  selectedFilters,
}) => {
  // State to manage the filters
  // const [filters, setFilters] = useState([
  //   'Filter 1',
  //   'Filter 2',
  //   'Filter 3',
  // ]);

  // Function to remove a filter
  // const [disableApply, setDisableApply] = useState(true);
  const handleRemoveFilter = (filterToRemove) => {
    setSelectedFilters(
      selectedFilters.filter((filter) => filter !== filterToRemove)
    );
  };

  // useEffect(() => {
  //   console.log(filters);
  //   // if (filters.length > 1) {
  //   //   setDisableApply(false);
  //   // } else {
  //   //   setDisableApply(true);
  //   // }
  // }, [filters]);
  // Function to apply all filters
  const handleApplyFilters = () => {
    // Your logic to apply filters
    // console.log("Applying filters:", filters);
    setApplyFilter(true);
  };

  const resetFilters = () => {
    // Logic to reset filters
    // setFilters([
    //   // Your initial filters state
    // ]);
    setSelectedFilters([{ name: "status", value: "all", label: "all" }]);
    let newFilters = filters.map((filter) => {
      let newFilter = { ...filter };
      if (newFilter.value) {
        newFilter.value = false;
      }

      if (newFilter.options && newFilter.defaultStatus) {
        newFilter.defaultStatus = "all";
      }

      if (newFilter.options && newFilter.groupOf === "checkbox") {
        newFilter.options.forEach((op) => {
          op.value = false;
        });
      }
      return newFilter;
    });
    console.log(newFilters);
    setFiltersOptions(newFilters);
    setApplyFilter(true);
    console.log("Filters reset");
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* <Typography variant="h6">Applied Filters:</Typography> */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          padding: "10px",
          border: "1px solid #80808063",
          borderRadius: "5px",
        }}
      >
        {selectedFilters.length > 0 &&
          selectedFilters.map((filter, index) => (
            <Chip
              key={index}
              label={filter.label}
              // onDelete={() => handleRemoveFilter(filter)}
              // deleteIcon={<CloseIcon />}
            />
          ))}
      </Box>
      {/* <Button
        variant="outlined"
        color="primary"
        onClick={handleApplyFilters}
        sx={{ alignSelf: "flex-start" }}
      >
        Apply Filters
      </Button> */}

      <div
        style={{ display: "flex", justifyContent: "flex-start", gap: "8px" }}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<FilterListIcon />}
          onClick={handleApplyFilters}
          // disabled={disableApply}
        >
          Apply
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<ClearAllIcon />}
          onClick={resetFilters}
          // disabled={disableApply}
        >
          Clear
        </Button>
      </div>
    </Box>
  );
};

// export default FilterComponent;

const Contacts = () => {
  const [tableData, setTableData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { jobRefId } = useParams();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([
    { name: "status", value: "all", label: "all" },
  ]);
  const [applyFilter, setApplyFilter] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  let tableDataKeys = [
    "title",
    "websiteUrl",
    "phoneNumber",
    "email",
    "status",
    "extractionInfo.status",
    "extractionInfo.message",
  ];
  let check = useRef(false);
  const params = new URLSearchParams(window.location.search);
  let defaultFilters = [
    {
      label: "Email",
      value: false,
      name: "email",
      defaultStatus: "all",
      checkBox: false,
      groupOf: "radio",
      options: [
        {
          label: "All",
          value: "all",
          name: "status",
          radio: true,
        },
        {
          label: "Not Verified",
          value: "notVerified",
          name: "status",
          radio: true,
        },
        {
          label: "Valid",
          value: "valid",
          name: "status",
          radio: true,
        },
        {
          label: "Invalid",
          value: "invalid",
          name: "status",
          radio: true,
        },
      ],
    },
    {
      label: "Phone Number",
      value: false,
      name: "phoneNumber",
      checkBox: true,
    },
    {
      label: "Website Url",
      value: false,
      name: "websiteUrl",
      checkBox: true,
    },
  ];

  const [defaultFiltersOptions, setdefaultFiltersOptions] =
    useState(defaultFilters);
  const initialQueryParams = (filters) => {
    let newFilters = filters.map((filter) => {
      if (params.get(filter.name)) {
        filter.value = params.get(filter.name) === "true";
      } else {
        filter.value = false;
      }

      if (filter.options && filter.defaultStatus) {
        let name = filter.options[0].name;
        if (params.get(name)) {
          filter.defaultStatus = params.get(name);
        }
      }

      if (filter.options && filter.groupOf === "checkbox") {
        let options = JSON.parse(params.get("jobs"));
        if (options && options.length > 0) {
          filter.options.forEach((op) => {
            if (options.includes(op.name)) {
              op.value = true;
            } else {
              op.value = false;
            }
          });
        } else {
          let check = filter.options.find((op) => op.value);
          if (check) {
            check.value = false;
          }
        }
      }

      return filter;
    });
    // setdefaultFiltersOptions(newFilters);
    return newFilters;
  };
  const [filtersOptions, setFiltersOptions] = useState(
    initialQueryParams(defaultFiltersOptions) || []
  );

  useEffect(() => {
    (async () => {
      if (!jobRefId) {
        let options = [];
        let Url = `${process.env.REACT_APP_API_URL}/jobs?jobStatus=Verified`;

        let response = await axios.get(Url);
        response.data.forEach((doc) => {
          // if (!options.find((option) => option.name === doc.jobRefId._id)) {
          options.push({
            label: doc.name ? doc.name : doc.jobId,
            value: false,
            name: doc._id,
            checkBox: true,
          });
          // }
        });
        if (options.length > 0) {
          // options.reverse();
          let jobs = {
            label: "Jobs",
            value: false,
            name: "jobs",
            checkBox: false,
            options: options,
            groupOf: "checkbox",
          };
          let job = defaultFiltersOptions.find((el) => el.label === "Jobs");
          if (!job) {
            let newFilters = [...defaultFiltersOptions, jobs];
            setFiltersOptions(initialQueryParams(newFilters));
            check.current = true;
          }
        }
      }
    })();
  }, []);

  const getJobs = async (params) => {
    console.log(params.toString());
    setLoading(true);
    try {
      let Url = `${process.env.REACT_APP_API_URL}/contacts`;
      if (jobRefId) {
        Url = Url + "/" + jobRefId;
      }
      let response = await axios.get(Url, { params });
      let filterKeys = [
        "title",
        "websiteUrl",
        "phoneNumber",
        "email",
        "status",
        "extractionInfo",
      ];
      const filteredData = response.data.map((item) => {
        return filterKeys.reduce((obj, key) => {
          if (item[key]) obj[key] = item[key];
          return obj;
        }, {});
      });

      setTableData(filteredData);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      let queryParams = {};
      filtersOptions.forEach((el) => {
        if (el.value) {
          queryParams[el.name] = el.value;
        } else {
          delete queryParams[el.name];
        }
        if (el.options && el.defaultStatus) {
          if (
            el.defaultStatus === "valid" ||
            el.defaultStatus === "invalid" ||
            el.defaultStatus === "notVerified"
          ) {
            queryParams[el.options[0].name] = el.defaultStatus;
          } else {
            delete queryParams[el.options[0].name];
          }
        }

        if (el.options && el.groupOf === "checkbox") {
          let jobs = el.options.filter((op) => op.value).map((op) => op.name);
          if (jobs.length > 0) {
            queryParams["jobs"] = JSON.stringify(jobs);
          }
        }
      });
      await getJobs(queryParams);
      if (applyFilter) {
        setApplyFilter(false);
      }
    })();
  }, [applyFilter]);

  let tableHeaders = [
    {
      title: "Title",
    },
    {
      title: "Website Url",
    },
    {
      title: "Phone Number",
    },
    {
      title: "Email",
    },
    {
      title: "Validation status",
    },
    {
      title: "Scrapper status",
    },
    {
      title: "message",
    },
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleCheckBoxChange = (e) => {
    let names = ["email", "websiteUrl", "status", "phoneNumber"];
    let { name, checked } = e.target;
    // if (names.includes(name)) {
    //   if (checked) {
    //     params.set(name, checked);
    //   } else {
    //     params.delete(name);
    //   }
    // } else {
    //   let jobs = JSON.parse(params.get("jobs")) || [];
    //   if (checked) {
    //     jobs.push(name);
    //     params.set("jobs", JSON.stringify(jobs));
    //   } else {
    //     let index = jobs.indexOf(name);
    //     console.log(index);
    //     // if(index){
    //     jobs.splice(index, 1);
    //     // }
    //     if (jobs.length === 0) {
    //       params.delete("jobs");
    //     } else {
    //       params.set("jobs", JSON.stringify(jobs));
    //     }
    //   }
    // }

    // const queryString = params.toString();
    // queryString
    //   ? window.history.replaceState(
    //       null,
    //       "",
    //       `${window.location.pathname}?${queryString}`
    //     )
    //   : window.history.replaceState(null, "", `${window.location.pathname}`);

    setFiltersOptions(funcToSetFilters(filtersOptions, name, checked));
    setPage(0);
  };

  const handleRadioChange = (e) => {
    let { name, value } = e.target;
    // if (value) {
    //   params.set(name, value);
    // } else {
    //   params.delete(name);
    // }

    // const queryString = params.toString();
    // queryString
    //   ? window.history.replaceState(
    //       null,
    //       "",
    //       `${window.location.pathname}?${queryString}`
    //     )
    //   : window.history.replaceState(null, "", `${window.location.pathname}`);

    setFiltersOptions(funcToSetFilters(filtersOptions, name, value));
    setPage(0);
  };

  let funcToSetFilters = (filters, name, value) => {
    console.log(name, value);
    let newFilters = filters.map((filter) => {
      let newFilter = { ...filter };
      if (name === newFilter.name) {
        console.log("success");
        newFilter.value = value;
      }
      console.log(newFilter);
      //  else {
      //   filter.value = false;
      // }

      if (filter.options && filter.defaultStatus) {
        let opName = filter.options[0].name;
        if (opName === name) {
          newFilter.defaultStatus = value;
        }
      }

      if (newFilter.options && newFilter.groupOf === "checkbox") {
        // let options = JSON.parse(params.get("jobs"));
        // if (options && options.length > 0) {
        newFilter.options.forEach((op) => {
          // if (options.includes(op.name)) {
          //   op.value = true;
          // } else {
          //   op.value = false;
          // }
          if (op.name === name) {
            op.value = value;
          }
        });
        // } else {
        //   let check = filter.options.find((op) => op.value);
        //   if (check) {
        //     check.value = false;
        //   }
        // }
      }

      return newFilter;
    });
    // setdefaultFiltersOptions(newFilters);
    setSelectedFilters(funcToSetSlectedFilters(newFilters));

    return newFilters;
  };
  const funcToSetSlectedFilters = (filters) => {
    // console.log(name,value)
    let selectedOnes = [];
    let newFilters = filters.forEach((filter) => {
      let newFilter = { ...filter };

      if (filter.value) {
        selectedOnes.push({
          name: filter.name,
          value: filter.value,
          label: filter.name,
        });
      }

      if (filter.options && filter.defaultStatus) {
        let opName = filter.options[0].name;

        selectedOnes.push({
          name: opName,
          value: filter.defaultStatus,
          label: filter.defaultStatus,
        });
      }

      if (newFilter.options && newFilter.groupOf === "checkbox") {
        newFilter.options.forEach((op) => {
          if (op.value) {
            selectedOnes.push({
              name: "jobs",
              value: op.name,
              label: op.label,
            });
          }
        });
      }
    });
    console.log(selectedOnes);
    return selectedOnes;
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);

    const options = { year: "numeric", month: "long", day: "numeric" };
    const formattedDate = date.toLocaleDateString(undefined, options);

    const formattedTime = date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    return `${formattedDate} ${formattedTime}`;
  };

  return (
    <div style={{paddingBottom:"20px"}}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            minHeight: "75vh",
            alignItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
              alignItems: "center",
            }}
          >
            {selectedFilters.length > 0 && (
              <FilterComponent
                setFiltersOptions={setFiltersOptions}
                setSelectedFilters={setSelectedFilters}
                filters={filtersOptions}
                applyFilter={applyFilter}
                setApplyFilter={setApplyFilter}
                selectedFilters={selectedFilters}
              ></FilterComponent>
            )}

            {!jobRefId && (
              <Button
                sx={{ maxHeight: "40px" }}
                onClick={handleClickOpen}
                variant="outlined"
              >
                {" "}
                Download
              </Button>
            )}
          </Box>
          <FormDialog
            open={open}
            setOpen={setOpen}
            data={tableData}
          ></FormDialog>
          <Box className={styles.docContainer}>
            <Box className={styles.filterSection}>
              <h2>Filters ({tableData.length})</h2>
              <Box>
                {filtersOptions.map((filter) => {
                  return (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-start",
                        flexDirection: "column",
                        marginBottom: "10px",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-start",
                          alignItems: "center",
                          marginBottom: `${!filter.options && "10px"}`,
                        }}
                      >
                        {filter.checkBox && (
                          <Checkbox
                            {...label}
                            // defaultChecked={filter.value}
                            color="success"
                            name={filter.name}
                            checked={filter.value}
                            onChange={(e) => handleCheckBoxChange(e)}
                          />
                        )}

                        <label
                          htmlFor=""
                          style={{ marginLeft: !filter.checkBox && "10px" }}
                        >
                          {filter.label}
                        </label>
                      </Box>
                      {filter.options && filter.groupOf === "radio" ? (
                        <RadioGroup
                          aria-labelledby="status"
                          name="status"
                          sx={{ marginLeft: "20px" }}
                          defaultValue={filter.defaultStatus}
                        >
                          {filter.options.map((filterOp) => (
                            <FormControlLabel
                              value={filterOp.value}
                              control={<Radio />}
                              label={filterOp.label}
                              onChange={(e) => handleRadioChange(e)}
                            />
                          ))}
                        </RadioGroup>
                      ) : (
                        filter.options && (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-start",
                              alignItems: "center",
                              flexDirection: "column",
                              marginBottom: `${!filter.options && "10px"}`,
                              maxHeight: "35vh",
                              overflowY: "auto",
                            }}
                          >
                            {" "}
                            {filter.options.map((filterOp, i) => (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  marginBottom: `${!filter.options && "10px"}`,
                                  width: "100%",
                                }}
                              >
                                <Checkbox
                                  {...label}
                                  defaultChecked={filterOp.value}
                                  color="success"
                                  name={filterOp.name}
                                  checked={filterOp.value}
                                  onChange={(e) => handleCheckBoxChange(e)}
                                />
                                <label htmlFor="">{filterOp.label}</label>
                              </Box>
                            ))}
                          </Box>
                        )
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
            <Box className={styles.dataSection}>
              <TableContainer component={Paper} data-testid="customtable">
                <Table
                  className={styles.tableCont}
                  aria-label="customized table"
                >
                  <TableHead className={styles.headerRow}>
                    <TableRow>
                      {tableHeaders.map((header) => (
                        <StyledTableCell
                          sx={{ fontSize: "17px" }}
                          align="center"
                        >
                          {header.title}
                        </StyledTableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData.length > 0 &&
                      (rowsPerPage > 0
                        ? tableData.slice(
                            page * rowsPerPage,
                            page * rowsPerPage + rowsPerPage
                          )
                        : tableData
                      ).map((row, i) => (
                        <StyledTableRow key={i} className={styles.tableBodyRow}>
                          {tableDataKeys.map((key, i) => {
                            return (
                              <StyledTableCell
                                key={i}
                                align="center"
                                className={styles.td}
                              >
                                <label htmlFor="">
                                  {tableHeaders[i].title} :{" "}
                                </label>
                                {key === "actions" ? (
                                  <div>
                                    <Button
                                      disabled={row.jobStatus !== "Completed"}
                                    ></Button>
                                  </div>
                                ) : (
                                  <Tooltip
                                    placement="top"
                                    arrow
                                    title={
                                      key === "createdAt" || key === "updatedAt"
                                        ? formatDate(row[key])
                                        : key === "extractionInfo.status"
                                        ? row.extractionInfo?.status
                                        : key === "extractionInfo.message"
                                        ? row.extractionInfo?.message
                                        : !row[key]
                                        ? "N/A"
                                        : row[key]
                                    }
                                  >
                                    <p>
                                      {key === "createdAt" ||
                                      key === "updatedAt"
                                        ? formatDate(row[key])
                                        : key === "extractionInfo.status"
                                        ? row?.extractionInfo?.status
                                        : key === "extractionInfo.message"
                                        ? row?.extractionInfo?.message
                                        : !row[key]
                                        ? "N/A"
                                        : row[key]}
                                    </p>
                                  </Tooltip>
                                )}
                              </StyledTableCell>
                            );
                          })}
                        </StyledTableRow>
                      ))}
                    {tableData.length === 0 && (
                      <StyledTableRow data-testid="noResults">
                        <StyledTableCell align="center"></StyledTableCell>
                        <StyledTableCell align="center"></StyledTableCell>
                        <StyledTableCell align="center">
                          No Contacts
                        </StyledTableCell>
                        <StyledTableCell align="center"></StyledTableCell>
                        <StyledTableCell align="center"></StyledTableCell>
                      </StyledTableRow>
                    )}
                  </TableBody>
                </Table>
                <TableFooter>
                  <TableRow>
                    <TablePagination
                      rowsPerPageOptions={[
                        5,
                        10,
                        25,
                        { label: "All", value: -1 },
                      ]}
                      colSpan={3}
                      count={tableData.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      slotProps={{
                        select: {
                          inputProps: {
                            "aria-label": "rows per page",
                          },
                          native: true,
                        },
                      }}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      ActionsComponent={TablePaginationActions}
                    />
                  </TableRow>
                </TableFooter>
              </TableContainer>
            </Box>
          </Box>
        </>
      )}
    </div>
  );
};

export default Contacts;

function FormDialog({ open, setOpen, data }) {
  const [downloadData, setDownloadData] = useState([]);

  const handleClose = () => {
    setOpen(false);
  };

  // const getDownloadContacts = async () => {
  //   try {
  //     let response = await axios.get(
  //       `${process.env.REACT_APP_API_URL}/contacts/${jobId}?email=true&status=valid`
  //     );
  //     let filterKeys = ["title", "websiteUrl", "phoneNumber", "email"];
  //     const filteredData = response.data.map((item) => {
  //       return filterKeys.reduce((obj, key) => {
  //         if (item[key]) obj[key] = item[key];
  //         return obj;
  //       }, {});
  //     });
  //     setDownloadData(filteredData);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  useEffect(() => {
    (async () => {
      console.log(open);

      if (open) {
        let filterKeys = [
          "title",
          "websiteUrl",
          "phoneNumber",
          "email",
          "status",
        ];
        const filteredData = data.map((item) => {
          return filterKeys.reduce((obj, key) => {
            if (item[key]) obj[key] = item[key];
            return obj;
          }, {});
        });
        setDownloadData(filteredData);
      }
    })();
  }, [open]);

  const downloadCSV = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    const dataBlob = new Blob([csvContent], {
      type: "text/csv",
    });

    const secureBlobUrl = URL.createObjectURL(dataBlob);

    const anchorElement = document.createElement("a");
    anchorElement.href = secureBlobUrl;
    anchorElement.download = `${filename}.csv`;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  };

  const downloadExcel = (data, filename) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const columnWidths = [];
    data.forEach((row) => {
      Object.values(row).forEach((value, index) => {
        const cellLength = value ? value.toString().length : 0;
        if (!columnWidths[index] || cellLength > columnWidths[index]) {
          columnWidths[index] = cellLength;
        }
      });
    });
    worksheet["!cols"] = columnWidths.map((width) => {
      return { width: width > 40 ? 40 * 1.2 : width * 1.2 };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    const secureBlobUrl = URL.createObjectURL(dataBlob);
    const anchorElement = document.createElement("a");
    anchorElement.href = secureBlobUrl;
    anchorElement.download = `${filename}.xlsx`;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  };
  return (
    <React.Fragment>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const filename = formJson.filename;
            const fileformat = formJson.fileformat;
            if (fileformat === "xls") {
              downloadExcel(downloadData, filename);
            } else if (fileformat === "csv") {
              downloadCSV(downloadData, filename);
            }
            handleClose();
          },
        }}
      >
        <DialogTitle>Export Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To download the file, please enter the filename and select the file
            format.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="filename"
            name="filename"
            label="Filename"
            type="text"
            fullWidth
            variant="standard"
          />
          <FormControl fullWidth margin="dense" variant="standard">
            <InputLabel id="fileformat-label">File Format</InputLabel>
            <Select
              labelId="fileformat-label"
              id="fileformat"
              name="fileformat"
              required
              defaultValue=""
            >
              <MenuItem value="xls">XLS</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Download</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
